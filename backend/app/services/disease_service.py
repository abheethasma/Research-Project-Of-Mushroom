# backend/app/services/disease_service.py

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image
import tensorflow as tf


@dataclass
class DiseasePrediction:
    label: str          # "black_mold" | "green_mold" | "healthy" | "invalid_image"
    confidence: float   # 0.0 - 1.0
    severity: str       # "none" | "mild" | "moderate" | "severe"


# MUST match Colab output exactly (order + spelling)
CLASS_NAMES = ["black_mold", "green_mold", "healthy", "other"]

IMG_SIZE = (224, 224)
INVALID_LABEL = "invalid_image"

# Extra safety: if confidence is extremely low, also mark invalid
LOW_CONF_THRESHOLD = 0.40

BASE_DIR = Path(__file__).resolve().parents[2]  # .../backend
MODEL_PATH = BASE_DIR / "models" / "mushroom_disease_model.h5"

_model = None


def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model


def _preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize(IMG_SIZE)
    arr = np.array(image).astype("float32")
    arr = np.expand_dims(arr, axis=0)
    return arr


def _severity_from_confidence(label: str, confidence: float) -> str:
    if label in ["healthy", INVALID_LABEL]:
        return "none"
    if confidence < 0.75:
        return "mild"
    elif confidence < 0.90:
        return "moderate"
    return "severe"


def severity_to_score(severity: str) -> int:
    return {"none": 0, "mild": 1, "moderate": 2, "severe": 3}.get(severity, 0)


def predict_disease_from_image(image_bytes: bytes) -> DiseasePrediction:
    model = _get_model()
    x = _preprocess_image(image_bytes)

    probs = model.predict(x)[0]  # softmax probs
    idx = int(np.argmax(probs))
    confidence = float(probs[idx])
    best_label = CLASS_NAMES[idx]

    # If model says "other" -> invalid_image
    # Also if confidence is extremely low -> invalid_image
    if best_label == "other" or confidence < LOW_CONF_THRESHOLD:
        final_label = INVALID_LABEL
    else:
        final_label = best_label

    severity = _severity_from_confidence(final_label, confidence)

    return DiseasePrediction(
        label=final_label,
        confidence=confidence,
        severity=severity,
    )