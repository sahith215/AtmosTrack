from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

# ---------- Config ----------
MODEL_PATH = "models/AtmosTrack_Global_Model.pkl"
FEATURES_PATH = "models/feature_names.pkl"
SOURCES = ['Vehicle', 'Industry', 'Construction', 'Clean']
MODEL_ACCURACY = 95.2  # from your training

# ---------- Load model ----------
model = joblib.load(MODEL_PATH)
deploy_features = joblib.load(FEATURES_PATH)

app = FastAPI(title="AtmosTrack AI Server")

class FeatureInput(BaseModel):
    VOC_avg: float
    VOC_std: float
    CO2_avg: float
    CO2_std: float
    Vibration_amp: float
    Vibration_freq: float
    Hour: int

@app.post("/classify")
def classify_source(data: FeatureInput):
    # keep feature order consistent with training
    x = np.array([[ 
        data.VOC_avg,
        data.VOC_std,
        data.CO2_avg,
        data.CO2_std,
        data.Vibration_amp,
        data.Vibration_freq,
        data.Hour
    ]])

    proba = model.predict_proba(x)[0]
    idx = int(np.argmax(proba))
    label = SOURCES[idx]
    confidence = float(proba[idx] * 100.0)

    return {
        "label": label,
        "confidence": round(confidence, 1),
        "modelAccuracy": MODEL_ACCURACY
    }
