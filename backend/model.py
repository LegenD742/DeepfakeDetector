import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import EfficientNet_B0_Weights
from pathlib import Path

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def build_model() -> nn.Module:
    model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, 1),
    )
    return model


def load_model(weights_path: str = "model.pt") -> nn.Module:
    path = Path(weights_path)
    model = build_model()
    if path.exists():
        state = torch.load(path, map_location=DEVICE)
        model.load_state_dict(state)
        print(f"[model] Loaded weights from {path}")
    else:
        print(f"[model] WARNING: {path} not found — CNN score will be random until you train and place model.pt here")
    model.to(DEVICE)
    model.eval()
    return model
