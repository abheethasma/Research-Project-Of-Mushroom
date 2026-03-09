# backend/app/services/disease_history_service.py

import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

from .disease_service import severity_to_score

BASE_DIR = Path(__file__).resolve().parents[2]  # .../backend
HISTORY_PATH = BASE_DIR / "data" / "disease_history.json"


def append_history_record(
    bag_id: str,
    label: str,
    severity: str,
    confidence: float,
) -> None:
    """
    Append one record (one prediction) to the JSON history file.
    Each record is one point in the time series for the given bag_id.
    """
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []

    record = {
        "bag_id": bag_id,
        "label": label,
        "severity": severity,
        "severity_score": severity_to_score(severity),
        "confidence": float(confidence),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    data.append(record)

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_history_for_bag(bag_id: str) -> List[Dict]:
    """
    Return all records for a given bag_id, sorted by timestamp (oldest first).
    """
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return []

    bag_records = [d for d in data if d.get("bag_id") == bag_id]
    bag_records.sort(key=lambda x: x.get("timestamp", ""))

    return bag_records