"""
predict_batch.py — Batch ML prediction for DigitalTwin Analytics

Called once per GET /analytics/{fieldId} request instead of 42 individual spawns.

Protocol
--------
  stdin  : JSON array of sensor-reading rows, e.g.:
               [{"temperature":30.1,"humidity":60.2,"soil_moisture":52.3,"rainfall":4.1}, ...]
  stdout : JSON array of prediction objects in the same order, e.g.:
               [{"healthScore":85.4,"predictedYield":6.12,"irrigationRequirement":3.20}, ...]
  stderr : forwarded to Spring Boot console (visible on error)

Performance
-----------
  All three models are loaded ONCE at process start (not per row).
  Each model.predict() call is a single vectorised operation over all N rows.
  Total overhead per invocation: ~1x Python startup + ~1x per-model joblib.load,
  rather than 42x process spawns + 42x model loads.
"""

import sys
import json
import os

import joblib
import pandas as pd

# ── Locate model files relative to this script ─────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load all three models ONCE ──────────────────────────────────────────────
# health_model.pkl   → RandomForestRegressor   (344 KB)
# yield_model.pkl    → GradientBoostingRegressor (143 KB)
# irrigation_model.pkl → DecisionTreeRegressor  (5 KB)
health_model     = joblib.load(os.path.join(BASE_DIR, "health_model.pkl"))
yield_model      = joblib.load(os.path.join(BASE_DIR, "yield_model.pkl"))
irrigation_model = joblib.load(os.path.join(BASE_DIR, "irrigation_model.pkl"))

# ── Read all input rows from stdin as a JSON array ──────────────────────────
raw_input = sys.stdin.read().strip()
rows = json.loads(raw_input)

# ── Build DataFrame from dict list (column names come from the JSON keys) ────
# Then explicitly select + reorder to match the training feature order used in
# train_model.py: ["temperature", "humidity", "soil_moisture", "rainfall"]
FEATURES = ["temperature", "humidity", "soil_moisture", "rainfall"]
df = pd.DataFrame(rows)[FEATURES]

# ── Fill any NaN values with the same defaults used in AnalyticsService.java ─
# (This handles the rare case of a null sensor reading in the database.)
DEFAULTS = {
    "temperature":   25.0,
    "humidity":      60.0,
    "soil_moisture": 50.0,
    "rainfall":       0.0,
}
df = df.fillna(DEFAULTS)

# ── Batch predict — one vectorised call per model, not one call per row ──────
health_preds     = health_model.predict(df).tolist()
yield_preds      = yield_model.predict(df).tolist()
irrigation_preds = irrigation_model.predict(df).tolist()

# ── Build output JSON array in the same row order as input ───────────────────
results = [
    {
        "healthScore":           round(health_preds[i],     2),
        "predictedYield":        round(yield_preds[i],      2),
        "irrigationRequirement": round(irrigation_preds[i], 2),
    }
    for i in range(len(rows))
]

# ── Print result to stdout — Java reads this ─────────────────────────────────
print(json.dumps(results))
