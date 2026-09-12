import os
import random
import psycopg2
from flask import Flask, jsonify
from crop_profiles import CROP_PROFILES

app = Flask(__name__)


def get_connection():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        database=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        sslmode="require"
    )


def generate_reading(profile):
    temp_min, temp_max = profile["temperature"]
    hum_min, hum_max = profile["humidity"]
    moisture_min, moisture_max = profile["soil_moisture"]

    temperature = round(random.uniform(temp_min, temp_max), 2)
    humidity = round(random.uniform(hum_min, hum_max), 2)
    soil_moisture = round(
        random.uniform(moisture_min, moisture_max), 2
    )

    rainfall = round(random.uniform(0, humidity / 5), 2)

    return temperature, humidity, soil_moisture, rainfall


@app.route("/")
def home():
    return "Digital Twin Sensor Simulator is running"


@app.route("/generate", methods=["POST", "GET"])
def generate_sensor_readings():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT field_id, crop_type
        FROM fields
    """)

    fields = cur.fetchall()

    generated = 0

    for field_id, crop_type in fields:

        profile = CROP_PROFILES.get(crop_type)

        if profile is None:
            continue

        temperature, humidity, soil_moisture, rainfall = \
            generate_reading(profile)

        cur.execute("""
            INSERT INTO sensor_readings
            (field_id, temperature, humidity, soil_moisture, rainfall)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            field_id,
            temperature,
            humidity,
            soil_moisture,
            rainfall
        ))

        generated += 1

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "status": "success",
        "readings_generated": generated
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)