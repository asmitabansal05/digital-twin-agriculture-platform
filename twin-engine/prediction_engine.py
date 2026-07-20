import psycopg2
import pandas as pd
from sklearn.linear_model import LinearRegression

# Connect to PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="digital_twin_agriculture",
    user="postgres",
    password="ashi"
)

# Read data from PostgreSQL
query = """
SELECT temperature, humidity, rainfall, soil_moisture
FROM sensor_readings
"""

df = pd.read_sql(query, conn)

# Features (inputs)
X = df[['temperature', 'humidity', 'rainfall']]

# Target (what we want to predict)
y = df['soil_moisture']

# Train model
model = LinearRegression()
model.fit(X, y)

print("Model trained successfully!")

# Example prediction
sample_data = pd.DataFrame({
    'temperature': [35],
    'humidity': [60],
    'rainfall': [5]
})

prediction = model.predict(sample_data)

print("Predicted Soil Moisture:", prediction[0])

print("\n----- WHAT IF SIMULATION -----")

case1 = pd.DataFrame({
    'temperature': [25],
    'humidity': [80],
    'rainfall': [15]
})

case2 = pd.DataFrame({
    'temperature': [40],
    'humidity': [50],
    'rainfall': [0]
})

moisture1 = model.predict(case1)[0]
moisture2 = model.predict(case2)[0]

print("Cool & Rainy Moisture:", round(moisture1, 2))
print("Hot & Dry Moisture:", round(moisture2, 2))
 

conn.close()