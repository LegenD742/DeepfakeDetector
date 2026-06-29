"""
detector.py — Three-signal deepfake detection pipeline.

Signals:
  1. FFT  — frequency domain uniformity (AI images are suspiciously smooth)
  2. ELA  — error level analysis (manipulation leaves inconsistent compression residuals)
  3. CNN  — EfficientNet-B0 fine-tuned on CIFAKE
"""

import io
import math
import numpy as np
from PIL import Image
import torch
from torchvision import transforms

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD  = [0.229, 0.224, 0.225]

_cnn_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(_IMAGENET_MEAN, _IMAGENET_STD),
])


# ---------------------------------------------------------------------------
# Signal 1 — FFT frequency analysis
# ---------------------------------------------------------------------------

def fft_score(img: Image.Image) -> float:
    """
    Returns a score in [0, 1] where HIGH = likely AI-generated.

    Real camera images have a natural 1/f power spectrum — lots of
    low-frequency energy that tapers off.  AI-generated images tend to have
    unnaturally uniform spectra with artifacts at regular intervals (GAN
    upsampling grid, diffusion tiling, etc.).

    We measure the ratio of mid-to-high frequency energy vs total energy.
    A low ratio = natural taper = real.  A high ratio = suspicious.
    """
    gray = np.array(img.convert("L"), dtype=np.float32)
    fft  = np.fft.fft2(gray)
    fft_shifted = np.fft.fftshift(fft)
    magnitude = np.log1p(np.abs(fft_shifted))

    h, w = magnitude.shape
    cy, cx = h // 2, w // 2
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)

    low_r  = min(h, w) * 0.1
    high_r = min(h, w) * 0.4

    low_energy  = magnitude[dist < low_r].sum()
    mid_energy  = magnitude[(dist >= low_r) & (dist < high_r)].sum()
    total       = magnitude.sum() + 1e-8

    # High mid-freq ratio relative to low = suspicious
    ratio = (mid_energy / total)

    # Normalise: empirically real ~0.30-0.40, AI ~0.42-0.55
    score = np.clip((ratio - 0.30) / 0.25, 0.0, 1.0)
    return float(score)


# ---------------------------------------------------------------------------
# Signal 2 — Error Level Analysis (ELA)
# ---------------------------------------------------------------------------

def ela_score(img: Image.Image, quality: int = 90) -> tuple[float, Image.Image]:
    """
    Returns (score, ela_image).

    score in [0, 1] where HIGH = likely manipulated / AI-generated.
    ela_image is the amplified residual map (for visualisation).

    Idea: re-save the image at a known JPEG quality and compute the
    pixel-wise difference.  Authentic uniform regions compress consistently
    so their ELA residual is low and uniform.  AI-generated regions or
    composited areas have inconsistent residuals.

    We flag images where the residual has high *variance* — meaning
    different regions compressed very differently.
    """
    buf = io.BytesIO()
    img_rgb = img.convert("RGB")
    img_rgb.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")

    orig_arr  = np.array(img_rgb,      dtype=np.float32)
    recomp_arr = np.array(recompressed, dtype=np.float32)

    diff = np.abs(orig_arr - recomp_arr)

    # Amplify for visualisation (10x, clipped to 255)
    ela_vis = np.clip(diff * 10, 0, 255).astype(np.uint8)
    ela_image = Image.fromarray(ela_vis)

    # Score: std of diff normalised to [0,1]
    # Real images: low std (~2-8). AI / edited: higher std (>15)
    std = diff.std()
    score = float(np.clip((std - 2.0) / 30.0, 0.0, 1.0))

    return score, ela_image


# ---------------------------------------------------------------------------
# Signal 3 — CNN inference
# ---------------------------------------------------------------------------

def cnn_score(img: Image.Image, model: torch.nn.Module) -> float:
    """
    Returns probability in [0, 1] that the image is AI-generated / fake.
    Model output: logit where sigmoid > 0.5 → REAL (class 1 in CIFAKE).
    We invert: fake_prob = 1 - real_prob.
    """
    tensor = _cnn_transform(img.convert("RGB")).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logit = model(tensor)
        real_prob = torch.sigmoid(logit).item()
    fake_prob = 1.0 - real_prob
    return float(fake_prob)


# ---------------------------------------------------------------------------
# Fusion
# ---------------------------------------------------------------------------

def fuse(fft: float, ela: float, cnn: float) -> dict:
    """
    Weighted average of the three signals.
    CNN carries the most weight since it's a trained classifier.
    """
    weights = {"fft": 0.20, "ela": 0.25, "cnn": 0.55}
    score = weights["fft"] * fft + weights["ela"] * ela + weights["cnn"] * cnn

    if score < 0.35:
        verdict = "authentic"
        label   = "Likely authentic"
    elif score < 0.60:
        verdict = "suspicious"
        label   = "Suspicious"
    else:
        verdict = "ai_generated"
        label   = "Likely AI-generated"

    return {
        "score":   round(score, 4),
        "verdict": verdict,
        "label":   label,
        "signals": {
            "fft": round(fft, 4),
            "ela": round(ela, 4),
            "cnn": round(cnn, 4),
        },
        "weights": weights,
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def analyze(img: Image.Image, model: torch.nn.Module) -> tuple[dict, Image.Image]:
    """
    Full pipeline. Returns (result_dict, ela_image).
    """
    f_score            = fft_score(img)
    e_score, ela_image = ela_score(img)
    c_score            = cnn_score(img, model)
    result             = fuse(f_score, e_score, c_score)
    return result, ela_image
