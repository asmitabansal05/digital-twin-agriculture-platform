package com.digitaltwin.backend.entity;

public class SimulationResponse {

    private Double healthScore;
    private Double predictedYield;
    private Double irrigationRequirement;
    private String recommendation;

    public Double getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(Double healthScore) {
        this.healthScore = healthScore;
    }

    public Double getPredictedYield() {
        return predictedYield;
    }

    public void setPredictedYield(Double predictedYield) {
        this.predictedYield = predictedYield;
    }

    public Double getIrrigationRequirement() {
        return irrigationRequirement;
    }

    public void setIrrigationRequirement(Double irrigationRequirement) {
        this.irrigationRequirement = irrigationRequirement;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

}