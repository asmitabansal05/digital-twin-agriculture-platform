package com.digitaltwin.backend.repository;

import com.digitaltwin.backend.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PredictionRepository extends JpaRepository<Prediction, Integer> {

    Prediction findTopByFieldIdOrderByPredictionIdDesc(Integer fieldId);

}