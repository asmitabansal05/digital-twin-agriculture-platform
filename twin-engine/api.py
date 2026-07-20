from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

class PredictionRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall: float

@app.get("/")
def home():
    return {"message": "Digital Twin AI Engine Running"}

@app.post("/predict")
def predict(data: PredictionRequest):

    predicted_moisture = (
        70
        + data.rainfall * 2
        - (data.temperature - 25) * 1.5
        + random.uniform(-2, 2)
    )

    recommendation = (
        "Irrigation Required"
        if predicted_moisture < 50
        else "No Irrigation Required"
    )

    return {
        "predicted_moisture": round(predicted_moisture, 2),
        "recommendation": recommendation
    }