package com.digitaltwin.backend.dto;

public class DashboardResponse {

    private String farmName;
    private int totalFields;
    private double averageHealth;
    private double averageMoisture;

    private Double temperature;
    private Double humidity;
    private Double soilMoisture;
    private Double rainfall;

    private String stressLevel;
    private String fieldStatus;
    private Double waterRequirement;

    private double predictedYield;

    

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getSoilMoisture() {
        return soilMoisture;
    }

    public void setSoilMoisture(Double soilMoisture) {
        this.soilMoisture = soilMoisture;
    }

    public Double getRainfall() {
        return rainfall;
    }

    public void setRainfall(Double rainfall) {
        this.rainfall = rainfall;
    }

    public String getStressLevel() {
        return stressLevel;
    }

    public void setStressLevel(String stressLevel) {
        this.stressLevel = stressLevel;
    }

    public String getFieldStatus() {
        return fieldStatus;
    }

    public void setFieldStatus(String fieldStatus) {
        this.fieldStatus = fieldStatus;
    }

    public Double getWaterRequirement() {
        return waterRequirement;
    }

    public void setWaterRequirement(Double waterRequirement) {
        this.waterRequirement = waterRequirement;
    }

    public String getFarmName() {
        return farmName;
    }

    public void setFarmName(String farmName) {
        this.farmName = farmName;
    }

    public int getTotalFields() {
        return totalFields;
    }

    public void setTotalFields(int totalFields) {
        this.totalFields = totalFields;
    }

    public double getAverageHealth() {
        return averageHealth;
    }

    public void setAverageHealth(double averageHealth) {
        this.averageHealth = averageHealth;
    }

    public double getAverageMoisture() {
        return averageMoisture;
    }

    public void setAverageMoisture(double averageMoisture) {
        this.averageMoisture = averageMoisture;
    }

    public double getPredictedYield() {
        return predictedYield;
    }

    public void setPredictedYield(double predictedYield) {
        this.predictedYield = predictedYield;
    }

    
}