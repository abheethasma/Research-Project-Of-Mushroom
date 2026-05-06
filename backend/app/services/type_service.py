# backend/app/services/type_service.py

from __future__ import annotations

from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
from io import BytesIO
import json

import numpy as np
from PIL import Image

# Windows-friendly: TensorFlow provides TFLite Interpreter
from tensorflow.lite.python.interpreter import Interpreter  # type: ignore


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

# ---- Tunable thresholds ----
# Suggestion: start with these, then adjust after testing
CONFIDENCE_THRESHOLD = 0.75   # if top-1 confidence below -> unknown
MARGIN_THRESHOLD = 0.10       # if top-1 - top-2 below -> unknown
ENTROPY_THRESHOLD = 1.05      # high uncertainty -> unknown (for 3 classes max entropy ~1.0986)

TOP_K = 3
IMG_SIZE = (224, 224)

# This file: backend/app/services/type_service.py
# parents[0]=services, [1]=app, [2]=backend
BACKEND_DIR = Path(__file__).resolve().parents[2]
MODELS_DIR = BACKEND_DIR / "models"

TFLITE_PATH = MODELS_DIR / "mushroom_type.tflite"
CLASSES_PATH = MODELS_DIR / "class_names.json"

# --------- Singleton TFLite state ---------
_interpreter: Optional[Interpreter] = None
_input_index: Optional[int] = None
_output_index: Optional[int] = None
_class_names: Optional[List[str]] = None


def _load_model_once() -> None:
    """Load TFLite model + class names once (singleton)."""
    global _interpreter, _input_index, _output_index, _class_names

    if _interpreter is not None and _class_names is not None:
        return

    if not TFLITE_PATH.exists():
        raise FileNotFoundError(f"TFLite model not found: {TFLITE_PATH}")

    if not CLASSES_PATH.exists():
        raise FileNotFoundError(f"class_names.json not found: {CLASSES_PATH}")

    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        _class_names = json.load(f)

    if not isinstance(_class_names, list) or len(_class_names) == 0:
        raise ValueError("class_names.json must be a non-empty list of strings.")
    if not all(isinstance(x, str) for x in _class_names):
        raise ValueError("class_names.json must contain only strings.")

    _interpreter = Interpreter(model_path=str(TFLITE_PATH))
    _interpreter.allocate_tensors()

    input_details = _interpreter.get_input_details()
    output_details = _interpreter.get_output_details()

    _input_index = int(input_details[0]["index"])
    _output_index = int(output_details[0]["index"])


def _read_image(file_bytes: bytes) -> Image.Image:
    """Read bytes -> PIL RGB image."""
    return Image.open(BytesIO(file_bytes)).convert("RGB")


def _preprocess(img: Image.Image) -> np.ndarray:
    """
    Preprocessing for TFLite model exported from Keras model that already contains
    MobileNetV2 preprocess_input layer.

    Therefore backend should only:
    - resize to 224x224
    - convert to float32
    - keep pixel values in 0..255
    """
    img = img.resize(IMG_SIZE)
    arr = np.asarray(img).astype(np.float32)  # keep 0..255
    arr = np.expand_dims(arr, axis=0)
    return arr


def _image_quality_flags(input_tensor: np.ndarray) -> Tuple[bool, Optional[str]]:
    """
    Simple quality detection:
    - Too dark
    - Too bright
    - Too low contrast (often unclear)
    input_tensor expected in [-1, 1]; convert to [0, 1] for checks.
    """
    x = input_tensor[0] / 255.0 # [0,1]
    gray = np.mean(x, axis=2)

    mean_val = float(np.mean(gray))
    std_val = float(np.std(gray))

    if mean_val < 0.10:
        return True, "Image is too dark. Please capture with better lighting."
    if mean_val > 0.90:
        return True, "Image is too bright. Avoid flash glare and retake."
    if std_val < 0.05:
        return True, "Image has low contrast/unclear details. Please retake closer."
    return False, None


def _softmax(x: np.ndarray) -> np.ndarray:
    x = x.astype(np.float32)
    x = x - np.max(x)  # stability
    ex = np.exp(x)
    s = float(np.sum(ex))
    if s <= 0:
        return np.ones_like(x, dtype=np.float32) / max(len(x), 1)
    return ex / s


def _to_probabilities(raw: np.ndarray) -> np.ndarray:
    """
    Convert model output to probabilities safely.
    Handles:
    - already probabilities (sum ~ 1, all >= 0)
    - logits (can contain negatives / sum not 1)
    """
    v = raw.astype(np.float32).reshape(-1)

    # If any negative value exists, it's very likely logits
    if np.any(v < 0):
        return _softmax(v)

    s = float(np.sum(v))
    # If sum is close to 1 and values are non-negative -> already probabilities
    if 0.98 <= s <= 1.02:
        # Clip and renormalize just in case
        v = np.clip(v, 1e-9, 1.0)
        return v / float(np.sum(v))

    # Otherwise could still be logits (e.g., not negative but not normalized)
    # Try softmax if values are not in [0,1] or sum is weird.
    if np.max(v) > 1.0 or s <= 0:
        return _softmax(v)

    # Fallback: normalize (for safety)
    v = np.clip(v, 1e-9, 1.0)
    return v / float(np.sum(v))


def _tflite_predict(input_tensor: np.ndarray) -> np.ndarray:
    """Run TFLite inference and return probabilities (num_classes,)."""
    _load_model_once()
    assert _interpreter is not None
    assert _input_index is not None
    assert _output_index is not None

    _interpreter.set_tensor(_input_index, input_tensor)
    _interpreter.invoke()
    out = _interpreter.get_tensor(_output_index)

    # out usually (1, num_classes)
    raw = out[0]
    probs = _to_probabilities(raw)
    return probs


def _entropy(probs: np.ndarray) -> float:
    """Shannon entropy of probability vector."""
    p = np.clip(probs.astype(np.float32), 1e-9, 1.0)
    return float(-np.sum(p * np.log(p)))


def predict_type(
    file_bytes: bytes,
) -> Tuple[bool, str, float, List[Tuple[str, float]], Optional[str]]:
    """
    Return:
      (ok, label, confidence, top_k, message)
    """
    img = _read_image(file_bytes)
    input_tensor = _preprocess(img)

    bad_quality, quality_msg = _image_quality_flags(input_tensor)
    probs = _tflite_predict(input_tensor)

    assert _class_names is not None
    if len(probs) != len(_class_names):
        raise ValueError(
            f"Model output classes ({len(probs)}) != class_names ({len(_class_names)}). "
            "Fix: export class_names.json from the SAME training run as the tflite model."
        )

    idx_sorted = np.argsort(probs)[::-1]
    top_k = [(_class_names[i], float(probs[i])) for i in idx_sorted[:TOP_K]]

    best_label, best_conf = top_k[0]
    second_conf = top_k[1][1] if len(top_k) > 1 else 0.0

    ent = _entropy(probs)
    margin = float(best_conf - second_conf)

    # Unknown conditions
    if (
        bad_quality
        or best_conf < CONFIDENCE_THRESHOLD
        or margin < MARGIN_THRESHOLD
        or ent > ENTROPY_THRESHOLD
    ):
        msg = quality_msg or "Not confident (maybe not a mushroom). Please upload a clear mushroom image."
        # IMPORTANT: you wanted no top predictions when unknown
        return (False, "unknown", float(best_conf), [], msg)

    return True, best_label, float(best_conf), top_k, None


def predict_type_response(file_bytes: bytes) -> Dict[str, Any]:
    """
    JSON helper matching frontend expectation:
      { ok, label, confidence, top_k:[{label, confidence}], message }
    """
    ok, label, conf, top_k, msg = predict_type(file_bytes)
    return {
        "ok": ok,
        "label": label,
        "confidence": conf,
        "top_k": [{"label": l, "confidence": c} for (l, c) in top_k],
        "message": msg,
    }