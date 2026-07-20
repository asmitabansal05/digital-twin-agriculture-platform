import random
import psycopg2
from crop_profiles import CROP_PROFILES

# PostgreSQL Connection
conn = psycopg2.connect(
    host="localhost",
    database="digital_twin_agriculture",
    user="postgres",
    password="ashi"
)

cur = conn.cursor()

# Read all fields from database
cur.execute("""
SELECT field_id, crop_type
FROM fields
""")

fields = cur.fetchall()

# Generate sensor data for every field
for field_id, crop_type in fields:

    profile = CROP_PROFILES[crop_type]

    temp_min, temp_max = profile["temperature"]
    hum_min, hum_max = profile["humidity"]
    moisture_min, moisture_max = profile["soil_moisture"]

    # Generate 500 readings for each field
    for i in range(500):

        # 70% ideal conditions, 30% stressed conditions
        is_stressed = random.random() < 0.30

        if not is_stressed:

            temperature = round(random.uniform(temp_min, temp_max), 2)
            humidity = round(random.uniform(hum_min, hum_max), 2)
            soil_moisture = round(random.uniform(moisture_min, moisture_max), 2)

        else:

            # Randomly stress one parameter
            choice = random.choice(["temperature", "humidity", "soil"])

            if choice == "temperature":
                temperature = round(random.uniform(temp_max + 2, temp_max + 6), 2)
                humidity = round(random.uniform(hum_min, hum_max), 2)
                soil_moisture = round(random.uniform(moisture_min, moisture_max), 2)

            elif choice == "humidity":
                temperature = round(random.uniform(temp_min, temp_max), 2)
                humidity = round(random.uniform(hum_min - 20, hum_min - 5), 2)
                soil_moisture = round(random.uniform(moisture_min, moisture_max), 2)

            else:
                temperature = round(random.uniform(temp_min, temp_max), 2)
                humidity = round(random.uniform(hum_min, hum_max), 2)
                soil_moisture = round(random.uniform(moisture_min - 20, moisture_min - 5), 2)

        rainfall = round(random.uniform(0, humidity / 5), 2)

        # Insert into database
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

# Save changes
conn.commit()

print("Sensor data generated successfully!")

cur.close()
conn.close()