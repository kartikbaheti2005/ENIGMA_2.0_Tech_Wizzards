"""
ml_model.py  –  EfficientNet-B0 connector for DermAssist AI
------------------------------------------------------------
Drop this file into your backend/ folder alongside main.py.

Usage in main.py:
    from ml_model import load_model, run_inference, preprocess_image
"""

import os
import numpy as np
import cv2
import torch
import torch.nn as nn
import torchvision.models as tv_models

# ── Constants ──────────────────────────────────────────────────────────────────
NUM_CLASSES   = 7
CLASS_NAMES   = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc']

# Resolves to  <backend_dir>/efficientnet_best  regardless of where you run from
_BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_FOLDER = os.path.join(_BASE_DIR, "efficientnet_best")
MODEL_WEIGHTS = os.path.join(MODEL_FOLDER, "data.pkl")

_device   = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Build architecture ─────────────────────────────────────────────────────────
def _build_efficientnet() -> nn.Module:
    """EfficientNet-B0 with a single Linear head matching the saved weights."""
    model = tv_models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features   # 1280
    model.classifier = nn.Linear(in_features, NUM_CLASSES)
    return model


# ── Load weights ───────────────────────────────────────────────────────────────
def load_model() -> nn.Module | None:
    """
    Load the EfficientNet model from  backend/efficientnet_best/data.pkl.
    Returns the model on success, None on failure.
    """
    if not os.path.isdir(MODEL_FOLDER):
        print(f"❌ Model folder not found: {MODEL_FOLDER}")
        print("   → Unzip efficientnet_best_pt.zip into your backend/ folder.")
        return None

    if not os.path.isfile(MODEL_WEIGHTS):
        print(f"❌ Weights file not found: {MODEL_WEIGHTS}")
        return None

    try:
        state_dict = torch.load(MODEL_WEIGHTS, map_location=_device, weights_only=False)
        model = _build_efficientnet()
        model.load_state_dict(state_dict, strict=True)
        model.to(_device)
        model.eval()
        print(f"✅ EfficientNet loaded on {_device}  →  {MODEL_WEIGHTS}")
        return model
    except Exception as e:
        print(f"❌ Failed to load EfficientNet weights: {e}")
        return None


# ── Preprocessing ──────────────────────────────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Decode raw image bytes and return a normalised (1, 3, 224, 224) tensor
    ready for EfficientNet-B0.

    Raises ValueError if the image cannot be decoded.
    """
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Please upload a valid JPEG or PNG.")

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = img.astype("float32") / 255.0

    # ImageNet normalisation (required for torchvision EfficientNet backbone)
    mean = np.array([0.485, 0.456, 0.406], dtype="float32")
    std  = np.array([0.229, 0.224, 0.225], dtype="float32")
    img  = (img - mean) / std

    img    = np.transpose(img, (2, 0, 1))          # HWC → CHW
    tensor = torch.from_numpy(img).unsqueeze(0)    # add batch dim → (1,3,224,224)
    return tensor.to(_device)


# ── Inference ──────────────────────────────────────────────────────────────────
def run_inference(model: nn.Module, image_bytes: bytes) -> tuple[str, float, np.ndarray]:
    """
    Run a single prediction.

    Returns
    -------
    predicted_class : str          e.g. 'mel'
    confidence      : float        probability of the top class  (0–1)
    all_probs       : np.ndarray   shape (7,), probabilities for all classes
    """
    tensor = preprocess_image(image_bytes)

    with torch.no_grad():
        logits = model(tensor)                          # (1, 7)
        probs  = torch.softmax(logits, dim=1)           # (1, 7)
        probs_np = probs.cpu().numpy()[0]               # (7,)

    idx        = int(np.argmax(probs_np))
    pred_class = CLASS_NAMES[idx]
    confidence = float(probs_np[idx])

    return pred_class, confidence, probs_np