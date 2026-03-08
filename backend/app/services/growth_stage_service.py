from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from datetime import datetime
import json

import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models


@dataclass
class GrowthStagePrediction:
    label: str
    confidence: float
    next_stage: str
    estimated_days_to_next_stage: str
    warning: str | None


CLASS_NAMES = [
    "Fruitbody Development",
    "Harvest Readiness",
    "Primordia Formation",
]

STAGE_INFO = {
    "Primordia Formation": {
        "next_stage": "Fruitbody Development",
        "estimated_days_to_next_stage": "2-4 days",
    },
    "Fruitbody Development": {
        "next_stage": "Harvest Readiness",
        "estimated_days_to_next_stage": "1-3 days",
    },
    "Harvest Readiness": {
        "next_stage": "Completed",
        "estimated_days_to_next_stage": "0 days",
    },
}

IMG_SIZE = (224, 224)
CONFIDENCE_WARNING_THRESHOLD = 0.80

BASE_DIR = Path(__file__).resolve().parents[2]   # backend/
WEIGHTS_PATH = BASE_DIR / "models" / "mushroom_growth_stage_model.weights.h5"
HISTORY_PATH = BASE_DIR / "data" / "growth_history.json"

_model = None


def _build_model():
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(3, activation="softmax"),
    ])

    model.build((None, 224, 224, 3))
    return model


def _get_model():
    global _model
    if _model is None:
        if not WEIGHTS_PATH.exists():
            raise FileNotFoundError(f"Weights file not found at: {WEIGHTS_PATH}")

        _model = _build_model()
        _model.load_weights(WEIGHTS_PATH)

    return _model


def _preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize(IMG_SIZE)

    arr = np.array(image).astype("float32") / 255.0
    arr = np.expand_dims(arr, axis=0)

    return arr


def _get_warning(confidence: float) -> str | None:
    if confidence < CONFIDENCE_WARNING_THRESHOLD:
        return "Low confidence. Please upload a clearer image."
    return None


def _ensure_history_file():
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not HISTORY_PATH.exists():
        HISTORY_PATH.write_text("[]", encoding="utf-8")


def save_growth_history(
    bag_id: str,
    label: str,
    confidence: float,
    next_stage: str,
    estimated_days_to_next_stage: str,
    warning: str | None,
):
    _ensure_history_file()

    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
        history = json.load(f)

    history.append({
        "bag_id": bag_id,
        "growth_stage": label,
        "confidence": round(confidence, 4),
        "next_stage": next_stage,
        "estimated_days_to_next_stage": estimated_days_to_next_stage,
        "warning": warning,
        "timestamp": datetime.now().isoformat()
    })

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


def get_growth_history_by_bag(bag_id: str):
    _ensure_history_file()

    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
        history = json.load(f)

    return [item for item in history if item["bag_id"] == bag_id]


def predict_growth_stage(image_bytes: bytes) -> GrowthStagePrediction:
    model = _get_model()
    input_tensor = _preprocess_image(image_bytes)

    preds = model.predict(input_tensor, verbose=0)[0]

    class_idx = int(np.argmax(preds))
    confidence = float(preds[class_idx])
    label = CLASS_NAMES[class_idx]

    stage_info = STAGE_INFO.get(label, {})
    next_stage = stage_info.get("next_stage", "Unknown")
    estimated_days = stage_info.get("estimated_days_to_next_stage", "Unknown")
    warning = _get_warning(confidence)

    return GrowthStagePrediction(
        label=label,
        confidence=confidence,
        next_stage=next_stage,
        estimated_days_to_next_stage=estimated_days,
        warning=warning,
    )