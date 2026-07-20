package com.digitaltwin.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "twin_states")
public class TwinState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "twin_id")
    private Integer twinId;

    @Column(name = "field_id")
    private Integer fieldId;

    @Column(name = "health_score")
    private Double healthScore;

    @Column(name = "stress_level")
    private String stressLevel;

    @Column(name = "field_status")
    private String fieldStatus;

    @Column(name = "water_requirement")
    private Double waterRequirement;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getTwinId() {
        return twinId;
    }

    public void setTwinId(Integer twinId) {
        this.twinId = twinId;
    }

    public Integer getFieldId() {
        return fieldId;
    }

    public void setFieldId(Integer fieldId) {
        this.fieldId = fieldId;
    }

    public Double getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(Double healthScore) {
        this.healthScore = healthScore;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
