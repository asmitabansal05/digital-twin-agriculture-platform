import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import random
# -----------------------------
# Load Dataset
# -----------------------------
data = pd.read_csv("sensor_dataset.csv")

# -----------------------------
# Generate Health Score (Target)
# -----------------------------
health_scores = []

for _, row in data.iterrows():

    health = 0

    # Soil Moisture Score (40 Marks)
    if row["soil_moisture"] >= 60:
        health += 40
    elif row["soil_moisture"] >= 40:
        health += 30
    elif row["soil_moisture"] >= 20:
        health += 15
    else:
        health += 5

    # Temperature Score (30 Marks)
    if 25 <= row["temperature"] <= 35:
        health += 30
    else:
        health += 15

    # Humidity Score (30 Marks)
    if 50 <= row["humidity"] <= 80:
        health += 30
    else:
        health += 15

    health_scores.append(health)

data["health_score"] = health_scores

# -----------------------------
# Generate Yield (Target)
# -----------------------------

yield_values = []

for _, row in data.iterrows():

    yield_score = 0

    # Soil Moisture Contribution
    yield_score += row["soil_moisture"] * 0.05

    # Humidity Contribution
    yield_score += row["humidity"] * 0.02

    # Rainfall Contribution
    yield_score += row["rainfall"] * 0.03

    # Temperature Penalty
    if 25 <= row["temperature"] <= 32:
        yield_score += 4
    else:
        yield_score += 2

    yield_values.append(round(yield_score,2))

data["yield"] = yield_values

# -----------------------------
# Generate Irrigation Requirement
# -----------------------------

water_requirement = []

for _, row in data.iterrows():

    water = 0

    if row["soil_moisture"] < 30:
        water = random.uniform(20, 35)

    elif row["soil_moisture"] < 50:
        water = random.uniform(10, 20)

    elif row["soil_moisture"] < 65:
        water = random.uniform(3, 10)

    else:
        water = 0

    water_requirement.append(round(water, 2))

data["water_requirement"] = water_requirement

# -----------------------------
# Features & Target
# -----------------------------
X = data[[
    "temperature",
    "humidity",
    "soil_moisture",
    "rainfall"
]]

y = data["health_score"]

# -----------------------------
# Train/Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------
# Train Random Forest
# -----------------------------
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------
# Evaluation
# -----------------------------
predictions = model.predict(X_test)

print("R2 Score:", r2_score(y_test, predictions))
print("MAE:", mean_absolute_error(y_test, predictions))

# -----------------------------
# Save Model
# -----------------------------
joblib.dump(model, "health_model.pkl")

print("\n✅ Machine Learning model trained successfully!")
print("✅ Model saved as health_model.pkl")

data.to_csv("training_dataset.csv", index=False)