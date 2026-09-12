package com.digitaltwin.backend.dto;

/**
 * Represents a single day's analytics data point:
 * actual sensor readings + ML model predictions.
 */
public class AnalyticsDayData {

    private String date;           // ISO-8601 date string or sequential label
    private int    readingId;      // Used as sequential orderer

    // Raw sensor values (from PostgreSQL)
    private double temperature;
    private double humidity;
    private double soilMoisture;
    private double rainfall;

    // ML model predictions
    private double healthScore;          // health_model.pkl  → %
    private double predictedYield;       // yield_model.pkl   → t/ha
    private double irrigationRequirement;// irrigation_model.pkl → mm

    // ── Getters & setters ──────────────────────────────────────────────

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public int getReadingId() { return readingId; }
    public void setReadingId(int readingId) { this.readingId = readingId; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public double getHumidity() { return humidity; }
    public void setHumidity(double humidity) { this.humidity = humidity; }

    public double getSoilMoisture() { return soilMoisture; }
    public void setSoilMoisture(double soilMoisture) { this.soilMoisture = soilMoisture; }

    public double getRainfall() { return rainfall; }
    public void setRainfall(double rainfall) { this.rainfall = rainfall; }

    public double getHealthScore() { return healthScore; }
    public void setHealthScore(double healthScore) { this.healthScore = healthScore; }

    public double getPredictedYield() { return predictedYield; }
    public void setPredictedYield(double predictedYield) { this.predictedYield = predictedYield; }

    public double getIrrigationRequirement() { return irrigationRequirement; }
    public void setIrrigationRequirement(double irrigationRequirement) {
        this.irrigationRequirement = irrigationRequirement;
    }
}
