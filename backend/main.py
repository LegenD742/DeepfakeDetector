"""
main.py — FastAPI backend for the deepfake detector.

Endpoints:
  POST /analyze   — upload an image, get detection result + ELA image (base64)
  GET  /health    — sanity check
"""

import base64
import io
import time

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from model import load_model
from detector import analyze

app = FastAPI(title="Deepfake Detector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
print("[startup] Loading model...")
MODEL = load_model("model.pt")
print("[startup] Ready.")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB).")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    t0 = time.perf_counter()
    result, ela_image = analyze(img, MODEL)
    elapsed = round((time.perf_counter() - t0) * 1000)

    # Encode ELA image as base64 so the frontend can display it without a second request
    ela_buf = io.BytesIO()
    ela_image.save(ela_buf, format="PNG")
    ela_b64 = base64.b64encode(ela_buf.getvalue()).decode()

    return JSONResponse({
        **result,
        "ela_image": f"data:image/png;base64,{ela_b64}",
        "processing_ms": elapsed,
        "filename": file.filename,
    })
