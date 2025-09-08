# backend/predictor.py
import os
import json
from typing import Dict, List, Tuple

import joblib
import numpy as np

# --- Paths (robust to working dir) ---
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "risk_prediction_model.pkl")
FEATURES_PATH = os.path.join(HERE, "features.json")

# --- Load model & feature order ---
model = joblib.load(MODEL_PATH)
with open(FEATURES_PATH, "r") as f:
    FEATURES: List[str] = json.load(f)

# Risk bins: Low <= 0.40, Medium (0.40, 0.70], High > 0.70
RISK_BOUNDS = {"low_hi": 0.4, "med_hi": 0.7}


def _row_from_patient(patient: Dict, allow_missing: bool = True):
    """
    Map incoming dict to ordered numeric vector expected by model.
    Returns: (X: np.ndarray[1, n_features], missing: List[str])
    """
    vals: List[float] = []
    missing: List[str] = []

    for col in FEATURES:
        if col not in patient:
            if allow_missing:
                vals.append(0.0)
                missing.append(col)
                continue
            raise ValueError(f"Missing feature: {col}")

        v = patient[col]
        if col == "date":
            # Explicitly ignored to match training; keep column position stable.
            vals.append(0.0)
            continue

        try:
            vals.append(float(v))
        except Exception:
            vals.append(0.0)
            if col not in missing:
                missing.append(col)

    X = np.array(vals, dtype=float).reshape(1, -1)
    return X, missing


def _risk_category(p: float) -> str:
    if p > RISK_BOUNDS["med_hi"]:
        return "High"
    if p > RISK_BOUNDS["low_hi"]:
        return "Medium"
    return "Low"


def predict(patient: Dict) -> Dict:
    """
    Return {"risk_score": float in [0..1] rounded to 2dp,
            "risk_category": Low/Medium/High,
            "missing_features": [...]}
    Tolerates missing/non-numeric fields by substituting 0.0.
    """
    X, missing = _row_from_patient(patient, allow_missing=True)

    if hasattr(model, "predict_proba"):
        p = float(model.predict_proba(X)[0, 1])
    else:
        # If regressor or classifier without proba: clamp to [0,1]
        p = float(model.predict(X)[0])
        p = max(0.0, min(1.0, p))

    return {
        "risk_score": round(p, 2),
        "risk_category": _risk_category(p),
        "missing_features": missing,
    }


def global_feature_importance() -> List[Tuple[str, float]]:
    """
    Returns sorted list of (feature, importance in [0..1], sum=1 approx).
    Uses model.feature_importances_ when available; otherwise applies a heuristic
    that emphasizes continuous vitals/labs and *_z features to provide a stable UI.
    """
    if hasattr(model, "feature_importances_"):
        imps = model.feature_importances_
        pairs = list(zip(FEATURES, imps))
    else:
        # Heuristic fallback to keep charts meaningful when importances aren't exposed.
        cont_keys = {
            "sbp_mean", "dbp_mean", "glucose_mean", "creatinine_mean",
            "wbc_mean", "hemoglobin_mean", "platelets_mean",
            "sodium_mean", "potassium_mean", "lactate_mean", "bun_mean",
            "heartrate_mean", "resp_rate_mean", "spo2_mean", "temp_mean",
            # z-scores
            "age_z", "sbp_mean_z", "dbp_mean_z", "glucose_mean_z", "bun_mean_z",
            "heartrate_mean_z", "resp_rate_mean_z", "spo2_mean_z", "temp_mean_z",
        }
        pairs = [(f, 1.0 if f in cont_keys else 0.2) for f in FEATURES]

    total = float(sum(abs(v) for _, v in pairs)) or 1.0
    norm = [(f, float(abs(v) / total)) for f, v in pairs]
    norm.sort(key=lambda x: x[1], reverse=True)
    return norm


def explain_patient(patient: Dict, top_k: int = 4) -> Dict:
    """
    Lightweight attribution: importance-weighted feature values.
    If *_z features exist, they are preferred as standardized effect proxies.
    Returns: {"attributions": [{"feature","direction","magnitude"}, ...]}
    """
    X, _missing = _row_from_patient(patient, allow_missing=True)
    vec = X.ravel()
    f2v = {FEATURES[i]: vec[i] for i in range(len(FEATURES))}

    def pick(name: str) -> float:
        # Prefer standardized version if available
        z = f"{name}_z"
        if z in f2v:
            return f2v[z]
        return f2v.get(name, 0.0)

    # Build value vector aligned to FEATURES (preferring *_z when applicable)
    values: List[float] = []
    for f in FEATURES:
        base = f.replace("_z", "")
        values.append(f2v.get(f, pick(base)))

    # Multiply by global importances to get contribution direction/magnitude
    imps = dict(global_feature_importance())
    contrib = [(f, float(values[i]) * imps.get(f, 0.0)) for i, f in enumerate(FEATURES)]
    contrib.sort(key=lambda t: abs(t[1]), reverse=True)
    top = contrib[: max(1, int(top_k))]

    pretty = [{
        "feature": name,
        "direction": "up" if val >= 0 else "down",
        "magnitude": round(abs(val), 3),
    } for name, val in top]

    return {"attributions": pretty}
