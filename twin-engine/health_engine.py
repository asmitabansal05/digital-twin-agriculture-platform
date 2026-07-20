import psycopg2
from crop_profiles import CROP_PROFILES

conn = psycopg2.connect(
    host="localhost",
    database="digital_twin_agriculture",
    user="postgres",
    password="ashi"
)

cur = conn.cursor()

# Read all fields
cur.execute("""
SELECT field_id, crop_type
FROM fields
""")

fields = cur.fetchall()

for field_id, crop_type in fields:

    profile = CROP_PROFILES[crop_type]

    temp_range = profile["temperature"]
    hum_range = profile["humidity"]
    moisture_range = profile["soil_moisture"]

    cur.execute("""
        SELECT temperature, humidity, soil_moisture, rainfall
        FROM sensor_readings
        WHERE field_id = %s
        ORDER BY reading_id DESC
        LIMIT 1
    """, (field_id,))

    data = cur.fetchone()

    if not data:
        continue

    temperature, humidity, soil_moisture, rainfall = data

    health = 100

    # Temperature penalty
    if not (temp_range[0] <= temperature <= temp_range[1]):
        health -= 15

    # Humidity penalty
    if not (hum_range[0] <= humidity <= hum_range[1]):
        health -= 15

    # Soil moisture penalty
    if not (moisture_range[0] <= soil_moisture <= moisture_range[1]):
        health -= 20

    health = max(0, health)

    if health >= 90:
        stress = "Low"
        status = "Healthy"
    elif health >= 75:
        stress = "Moderate"
        status = "Moderate Stress"
    elif health >= 60:
        stress = "High"
        status = "High Stress"
    else:
        stress = "Critical"
        status = "Critical"

    # Water requirement based on crop's ideal minimum moisture
    if soil_moisture < moisture_range[0]:
        water_requirement = round(moisture_range[0] - soil_moisture, 2)
    else:
        water_requirement = 0.0

    cur.execute("""
        INSERT INTO twin_states
        (field_id, health_score, stress_level, field_status, water_requirement)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        field_id,
        health,
        stress,
        status,
        water_requirement
    ))

conn.commit()

print("Twin states generated successfully.")

cur.close()
conn.close()