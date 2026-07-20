import pandas as pd
import joblib

from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

# Load dataset
data = pd.read_csv("training_dataset.csv")

# Features
X = data[[
    "temperature",
    "humidity",
    "soil_moisture",
    "rainfall"
]]

# Target
y = data["water_requirement"]

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train Decision Tree
model = DecisionTreeRegressor(
    max_depth=5,
    random_state=42
)

model.fit(X_train, y_train)

# Prediction
predictions = model.predict(X_test)

print("R2 Score:", r2_score(y_test, predictions))
print("MAE:", mean_absolute_error(y_test, predictions))

# Save model
joblib.dump(model, "irrigation_model.pkl")

print("\n✅ Irrigation Prediction Model trained successfully!")
print("✅ Model saved as irrigation_model.pkl")