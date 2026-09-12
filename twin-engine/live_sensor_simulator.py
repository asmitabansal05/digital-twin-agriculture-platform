import random
import time
import psycopg2
from crop_profiles import CROP_PROFILES


def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="digital_twin_agriculture",
        user="postgres",
        password="ashi"
    )


def generate_reading(profile):
    temp_min, temp_max = profile["temperature"]
    hum_min, hum_max = profile["humidity"]
    moisture_min, moisture_max = profile["soil_moisture"]

    temperature = round(random.uniform(temp_min, temp_max), 2)
    humidity = round(random.uniform(hum_min, hum_max), 2)
    soil_moisture = round(random.uniform(moisture_min, moisture_max), 2)

    rainfall = round(random.uniform(0, humidity / 5), 2)

    return temperature, humidity, soil_moisture, rainfall


while True:

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT field_id, crop_type
        FROM fields
    """)

    fields = cur.fetchall()

    for field_id, crop_type in fields:

        profile = CROP_PROFILES[crop_type]

        temperature, humidity, soil_moisture, rainfall = generate_reading(profile)

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

        print(
            f"Field {field_id} | "
            f"Temp: {temperature} | "
            f"Humidity: {humidity} | "
            f"Soil: {soil_moisture} | "
            f"Rain: {rainfall}"
        )

    conn.commit()

    cur.close()
    conn.close()

    print("New sensor readings generated.\n")

    time.sleep(10)