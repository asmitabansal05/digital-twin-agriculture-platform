package com.digitaltwin.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_id")
    private Integer predictionId;

    @Column(name = "field_id")
    private Integer fieldId;

    @Column(name = "predicted_moisture")
    private Double predictedMoisture;

    @Column(name = "predicted_yield")
    private Double predictedYield;

    private String recommendation;

    @Column(name = "predicted_at")
    private LocalDateTime predictedAt;

    public Integer getPredictionId() {
        return predictionId;
    }

    public void setPredictionId(Integer predictionId) {
        this.predictionId = predictionId;
    }

    public Integer getFieldId() {
        return fieldId;
    }

    public void setFieldId(Integer fieldId) {
        this.fieldId = fieldId;
    }

    public Double getPredictedMoisture() {
        return predictedMoisture;
    }

    public void setPredictedMoisture(Double predictedMoisture) {
        this.predictedMoisture = predictedMoisture;
    }

    public Double getPredictedYield() {
        return predictedYield;
    }

    public void setPredictedYield(Double predictedYield) {
        this.predictedYield = predictedYield;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public LocalDateTime getPredictedAt() {
        return predictedAt;
    }

    public void setPredictedAt(LocalDateTime predictedAt) {
        this.predictedAt = predictedAt;
    }
}
