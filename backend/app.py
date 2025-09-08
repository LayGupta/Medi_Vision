# backend/app.py
import os
import json
from datetime import datetime, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS

from predictor import (
    predict,
    FEATURES,
    global_feature_importance,
    explain_patient,
)

# ---------- Paths ----------
HERE = os.path.dirname(os.path.abspath(__file__))
PATIENTS_FILE = os.path.join(HERE, "patients.json")
ZSCORE_FILE = os.path.join(HERE, "zscore_stats.json")

# ---------- App & CORS ----------
app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
    supports_credentials=False,
)

@app.after_request
def add_cors_headers(resp):
    # allow common AJAX headers and verbs for dev
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

# ---------- Helpers ----------
def load_patients():
    if not os.path.exists(PATIENTS_FILE):
        return []
    with open(PATIENTS_FILE, "r") as f:
        return json.load(f)

def save_patients(rows):
    with open(PATIENTS_FILE, "w") as f:
        json.dump(rows, f, indent=2)

def day_index_from_date(dstr: str) -> int:
    """Convert YYYY-MM-DD to a day index (days since 1970-01-01)."""
    try:
        dt = datetime.strptime((dstr or "")[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return int(dt.timestamp() // 86400)
    except Exception:
        return 0

def load_zstats():
    if not os.path.exists(ZSCORE_FILE):
        return {}
    with open(ZSCORE_FILE, "r") as f:
        return json.load(f)

ZSTATS = load_zstats()

def zscore(name: str, value):
    if value is None:
        return 0.0
    try:
        v = float(value)
    except Exception:
        return 0.0
    meta = ZSTATS.get(name)
    if not meta:
        return 0.0
    mean = float(meta.get("mean", 0.0))
    std = float(meta.get("std", 1.0)) or 1.0
    return (v - mean) / std

def expand_basic_to_full(core: dict, date_str: str = None) -> dict:
    """
    Expand a compact 'core' payload into the full feature vector that matches FEATURES.
    Missing numeric values default to 0.0; z-scores are computed from zscore_stats.json.
    """
    core = core or {}
    full = {}

    # date & day_index
    date_val = date_str or core.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    full["date"] = date_val
    full["day_index"] = core.get("day_index", day_index_from_date(date_val))

    def getn(k, default=None):
        v = core.get(k, default)
        try:
            return float(v)
        except Exception:
            # friendly boolean parsing for flags
            s = str(v).lower()
            if s in ("true", "yes", "y"): return 1.0
            if s in ("false", "no", "n"): return 0.0
            return default

    # base raw features & comorbidity flags
    for k in [
        "age", "gender",
        "heartrate_mean", "resp_rate_mean", "spo2_mean", "temp_mean",
        "sbp_mean", "dbp_mean",
        "glucose_mean", "creatinine_mean", "wbc_mean", "hemoglobin_mean", "platelets_mean",
        "sodium_mean", "potassium_mean", "lactate_mean", "bun_mean",
        "diabetes", "hypertension", "copd", "ckd", "chf", "cad", "asthma", "cancer",
    ]:
        full[k] = getn(k, 0.0)

    # z-scores (prefer from provided raw)
    full["age_z"]               = zscore("age", full["age"])
    full["heartrate_mean_z"]    = zscore("heartrate_mean", full["heartrate_mean"])
    full["resp_rate_mean_z"]    = zscore("resp_rate_mean", full["resp_rate_mean"])
    full["spo2_mean_z"]         = zscore("spo2_mean", full["spo2_mean"])
    full["temp_mean_z"]         = zscore("temp_mean", full["temp_mean"])
    full["sbp_mean_z"]          = zscore("sbp_mean", full["sbp_mean"])
    full["dbp_mean_z"]          = zscore("dbp_mean", full["dbp_mean"])
    full["glucose_mean_z"]      = zscore("glucose_mean", full["glucose_mean"])
    full["creatinine_mean_z"]   = zscore("creatinine_mean", full["creatinine_mean"])
    full["wbc_mean_z"]          = zscore("wbc_mean", full["wbc_mean"])
    full["hemoglobin_mean_z"]   = zscore("hemoglobin_mean", full["hemoglobin_mean"])
    full["platelets_mean_z"]    = zscore("platelets_mean", full["platelets_mean"])
    full["sodium_mean_z"]       = zscore("sodium_mean", full["sodium_mean"])
    full["potassium_mean_z"]    = zscore("potassium_mean", full["potassium_mean"])
    full["lactate_mean_z"]      = zscore("lactate_mean", full["lactate_mean"])
    full["bun_mean_z"]          = zscore("bun_mean", full["bun_mean"])

    # ensure all expected FEATURES are present
    for f in FEATURES:
        if f not in full:
            full[f] = 0.0

    return full

# ---------- Routes ----------
@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.get("/api/features")
def get_features():
    return jsonify({"features": FEATURES})

@app.get("/api/feature_importance")
def get_importance():
    imps = global_feature_importance()
    top = [{"feature": f, "importance": round(v, 4)} for f, v in imps[:12]]
    return jsonify({"importance": top})

# Patients (list enriched with risk + last_checkin)
@app.get("/api/patients")
def get_patients():
    pts = load_patients()
    enriched = []
    for p in pts:
        feat = p.get("features", p)
        try:
            pred = predict(feat)
            p["risk_score"] = pred.get("risk_score")
            p["risk_category"] = pred.get("risk_category")
        except Exception:
            p["risk_score"] = None
            p["risk_category"] = None

        last = p.get("last_checkin") or feat.get("last_checkin") or feat.get("date")
        if isinstance(last, (int, float)) and not isinstance(last, bool):
            last = None
        p["last_checkin"] = last or "—"
        enriched.append(p)
    return jsonify(enriched)

@app.get("/api/patients/<int:pid>")
def get_patient(pid):
    pts = load_patients()
    p = next((x for x in pts if x.get("id") == pid), None)
    if not p:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(p)

@app.get("/api/patients/<int:pid>/vitals")
def vitals_series(pid):
    pts = load_patients()
    p = next((x for x in pts if x.get("id") == pid), None)
    if not p:
        return jsonify({"series": []})
    if "vitals_history" in p:
        return jsonify({"series": p["vitals_history"]})
    # fallback series so the chart isn't empty
    base = 100.0 + (pid % 9) * 5
    series = [{"label": f"Sep {d}", "value": round(base + (d * 3) + (d % 2) * 4, 1)} for d in [1, 5, 9, 12, 15, 18, 22]]
    return jsonify({"series": series})

# Add/Upsert patient (supports BASIC 'core' or FULL 'features')
@app.post("/api/patients")
def add_patient():
    # tolerant body parsing (in case Content-Type is missing)
    data = request.get_json(silent=True)
    if data is None and request.data:
        try:
            data = json.loads(request.data.decode("utf-8"))
        except Exception:
            data = {}
    body = data or {}

    pid = body.get("id")
    if pid is None:
        return jsonify({"error": "id is required"}), 400

    last_checkin = body.get("last_checkin")
    core = body.get("core")
    features = body.get("features")

    if core and not features:
        full_features = expand_basic_to_full(core, date_str=last_checkin or core.get("date"))
    else:
        # Use provided full features; ensure required keys exist
        f = dict(features or {})
        if not f.get("date") and last_checkin:
            f["date"] = last_checkin
        if "day_index" not in f and f.get("date"):
            f["day_index"] = day_index_from_date(f["date"])
        for key in FEATURES:
            f.setdefault(key, 0.0)
        full_features = f

    patient = {
        "id": pid,
        "last_checkin": last_checkin or full_features.get("date"),
        "features": full_features,
        "vitals_history": body.get("vitals_history", []),
    }

    # upsert into JSON file
    pts = load_patients()
    pts = [p for p in pts if p.get("id") != pid]
    pts.append(patient)
    save_patients(pts)

    # compute risk for immediate feedback
    try:
        pred = predict(full_features)
        patient["risk_score"] = pred.get("risk_score")
        patient["risk_category"] = pred.get("risk_category")
    except Exception:
        patient["risk_score"] = None
        patient["risk_category"] = None

    return jsonify(patient), 201

# Predict + Explain
@app.post("/api/predict_explain")
def predict_explain():
    data = request.get_json(silent=True) or {}
    patient = data.get("features", data)
    try:
        pred = predict(patient)
        exp = explain_patient(patient)
        return jsonify({**pred, **exp})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.post("/api/predict")
def predict_route():
    data = request.get_json(silent=True) or {}
    try:
        patient = data.get("features", data)
        result = predict(patient)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ---------- Main ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
