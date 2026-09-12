from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

health_model = joblib.load(os.path.join(BASE_DIR, "health_model.pkl"))
yield_model = joblib.load(os.path.join(BASE_DIR, "yield_model.pkl"))
irrigation_model = joblib.load(os.path.join(BASE_DIR, "irrigation_model.pkl"))


def create_data(temperature, humidity, soil_moisture, rainfall):
    return pd.DataFrame([{
        "temperature": temperature,
        "humidity": humidity,
        "soil_moisture": soil_moisture,
        "rainfall": rainfall
    }])


@app.route("/")
def home():
    return "Digital Twin ML API is running"


@app.route("/predict/health", methods=["POST"])
def predict_health():
    data = request.json

    df = create_data(
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["soil_moisture"]),
        float(data["rainfall"])
    )

    prediction = health_model.predict(df)

    return jsonify({"prediction": round(float(prediction[0]), 2)})


@app.route("/predict/yield", methods=["POST"])
def predict_yield():
    data = request.json

    df = create_data(
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["soil_moisture"]),
        float(data["rainfall"])
    )

    prediction = yield_model.predict(df)

    return jsonify({"prediction": round(float(prediction[0]), 2)})


@app.route("/predict/irrigation", methods=["POST"])
def predict_irrigation():
    data = request.json

    df = create_data(
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["soil_moisture"]),
        float(data["rainfall"])
    )

    prediction = irrigation_model.predict(df)

    return jsonify({"prediction": round(float(prediction[0]), 2)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)