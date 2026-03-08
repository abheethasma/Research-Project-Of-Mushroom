from __future__ import annotations

from typing import Optional, Dict, Any

STAGES = {
    "spawn_run": "Spawn Run",
    "fruiting": "Fruiting Phase",
}

# CO2 values are stored for reference only (display), not for alerts/recommendations.
# Button Mushroom spawn-run temp uses your tolerance: 23–25.
MUSHROOM_RANGES: Dict[str, Dict[str, Dict[str, Optional[float]]]] = {
    "Oyster Mushroom": {
        "spawn_run": {"temp_min": 24, "temp_max": 27, "rh_min": 90, "rh_max": 100, "co2_min": 20000, "co2_max": 20000},
        "fruiting": {"temp_min": 19, "temp_max": 20, "rh_min": 85, "rh_max": 92, "co2_min": 600, "co2_max": 600},
    },
    "Milky Mushroom": {
        "spawn_run": {"temp_min": 25, "temp_max": 30, "rh_min": 80, "rh_max": 90, "co2_min": 5000, "co2_max": None},   # >5000
        "fruiting": {"temp_min": 30, "temp_max": 38, "rh_min": 80, "rh_max": 90, "co2_min": 400, "co2_max": 800},
    },
    "Button Mushroom": {
        "spawn_run": {"temp_min": 23, "temp_max": 25, "rh_min": 80, "rh_max": 85, "co2_min": None, "co2_max": None},
        "fruiting": {"temp_min": 12, "temp_max": 18, "rh_min": 85, "rh_max": 90, "co2_min": None, "co2_max": 1000},
    },
}


def list_mushrooms() -> list[str]:
    return sorted(MUSHROOM_RANGES.keys())


def list_stages() -> list[dict[str, str]]:
    return [{"key": k, "label": v} for k, v in STAGES.items()]


def get_range(mushroom_type: str, stage: str) -> Dict[str, Any]:
    if mushroom_type not in MUSHROOM_RANGES:
        raise ValueError(f"Unknown mushroom type: {mushroom_type}")
    if stage not in MUSHROOM_RANGES[mushroom_type]:
        raise ValueError(f"Unknown stage '{stage}' for mushroom '{mushroom_type}'")
    return MUSHROOM_RANGES[mushroom_type][stage]
