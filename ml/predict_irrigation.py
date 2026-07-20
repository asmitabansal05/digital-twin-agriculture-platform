import sys
import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, "irrigation_model.pkl"))

temperature = float(sys.argv[1])
humidity = float(sys.argv[2])
soil_moisture = float(sys.argv[3])
rainfall = float(sys.argv[4])

data = pd.DataFrame([{
    "temperature": temperature,
    "humidity": humidity,
    "soil_moisture": soil_moisture,
    "rainfall": rainfall
}])

prediction = model.predict(data)

print(round(prediction[0], 2))