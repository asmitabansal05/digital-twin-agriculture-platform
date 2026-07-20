package com.digitaltwin.backend.service;

import com.digitaltwin.backend.entity.SimulationRequest;
import com.digitaltwin.backend.entity.SimulationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SimulationService {

    @Autowired
    private MLPredictionService mlPredictionService;

    @Autowired
    private YieldPredictionService yieldPredictionService;

    @Autowired
    private IrrigationPredictionService irrigationPredictionService;

    public SimulationResponse simulate(SimulationRequest request) {

        SimulationResponse response = new SimulationResponse();

        double health =
                mlPredictionService.predictHealth(
                        request.getTemperature(),
                        request.getHumidity(),
                        request.getSoilMoisture(),
                        request.getRainfall()
                );

        double predictedYield =
                yieldPredictionService.predictYield(
                        request.getTemperature(),
                        request.getHumidity(),
                        request.getSoilMoisture(),
                        request.getRainfall()
                );

        double irrigation =
                irrigationPredictionService.predictIrrigation(
                        request.getTemperature(),
                        request.getHumidity(),
                        request.getSoilMoisture(),
                        request.getRainfall()
                );

        response.setHealthScore(health);
        response.setPredictedYield(predictedYield);
        response.setIrrigationRequirement(irrigation);

        // AI Recommendation
        if (health >= 90) {

            response.setRecommendation(
                    "Crop health is excellent. Maintain current irrigation schedule."
            );

        } else if (health >= 75) {

            response.setRecommendation(
                    "Crop health is good. Continue monitoring soil moisture and weather."
            );

        } else if (health >= 60) {

            response.setRecommendation(
                    "Moderate crop stress detected. Increase irrigation and monitor field conditions."
            );

        } else {

            response.setRecommendation(
                    "High crop stress predicted. Immediate irrigation and field inspection are recommended."
            );

        }

        return response;

    }

}