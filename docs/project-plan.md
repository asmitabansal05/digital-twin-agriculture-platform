# Digital Twin Agriculture Platform

## Project Goal

To develop a Digital Twin-Driven Agriculture Platform that enables:

- Crop Health Monitoring
- Irrigation Optimization
- Yield Prediction
- What-If Scenario Simulation

The platform will initially use simulated sensor data and later support integration with real IoT sensors deployed in agricultural fields.

## Target Users

- Universities
- Researchers
- Farm Managers
- Agricultural Institutions

## Core Features

### 1. Crop Health Monitoring

Monitor field conditions using:

- Soil Moisture
- Temperature
- Humidity
- Rainfall

Output:

- Health Score
- Stress Level
- Field Status

### 2. Irrigation Optimization

Recommend:

- Whether irrigation is required
- When irrigation should be performed
- Estimated water requirement

### 3. Yield Prediction

Predict:

- Expected crop yield
- Future field performance

### 4. What-If Scenario Simulation

Simulate situations such as:

- Temperature increase
- Rainfall changes
- Delayed irrigation

Predict the impact on:

- Crop Health
- Water Requirement
- Yield

## Main Entities

### Farm

A farm contains multiple fields.

### Field

A field is the primary unit of monitoring in the platform.

All sensor data, predictions, simulations, and health assessments are associated with a field.

### Field Information

Each field should store:

- Field Name
- Area (acres/hectares)
- Crop Type
- Latitude
- Longitude

### Sensor Data

Each field will receive:

- Temperature (°C)
- Humidity (%)
- Soil Moisture (%)
- Rainfall (mm)
- Timestamp

### Crop Health Monitoring

The platform will calculate:

- Health Score (0-100)
- Stress Level
- Field Status

Field Status:

- Healthy
- Moderate Stress
- High Stress
- Critical

### Irrigation Optimization

The platform will recommend:

- Irrigation Required (Yes/No)
- Recommended Water Quantity
- Recommended Irrigation Time

The recommendation will be based on:

- Soil Moisture
- Temperature
- Humidity
- Rainfall

### Yield Prediction

The platform will estimate:

- Expected Yield
- Yield Trend
- Yield Risk Level

The prediction will be based on:

- Crop Health Score
- Soil Moisture
- Temperature
- Humidity
- Rainfall

### What-If Simulation

The platform will allow users to test different scenarios.

Example scenarios:

- Increase Temperature
- Decrease Soil Moisture
- Increase Rainfall
- Delay Irrigation

The platform will predict the impact on:

- Crop Health Score
- Water Requirement
- Yield

## System Architecture

Fake Sensor Data
        ↓
PostgreSQL Database
        ↓
Spring Boot Backend
        ↓
Digital Twin Engine (Python)
        ↓
Predictions & Simulations
        ↓
React Dashboard