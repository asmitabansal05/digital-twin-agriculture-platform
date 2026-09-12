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

        // AI Recommendation — context-aware, uses actual input values and ML results
        double temperature   = request.getTemperature();
        double humidity      = request.getHumidity();
        double soilMoisture  = request.getSoilMoisture();
        double rainfall      = request.getRainfall();

        StringBuilder rec = new StringBuilder();

        rec.append(String.format(
                "Under simulated conditions (%.1f°C, %.0f%% humidity, %.0f%% soil moisture, %.1f mm rainfall): ",
                temperature, humidity, soilMoisture, rainfall
        ));

        if (health >= 90) {
            rec.append(String.format(
                    "Crop health is excellent at %.0f%%. All environmental parameters are within optimal range. ",
                    health
            ));
        } else if (health >= 75) {
            rec.append(String.format(
                    "Crop health is good at %.0f%%. Continue monitoring soil moisture and weather conditions closely. ",
                    health
            ));
        } else if (health >= 60) {
            rec.append(String.format(
                    "Moderate crop stress detected — health score is %.0f%%. Review irrigation schedule and soil conditions immediately. ",
                    health
            ));
        } else {
            rec.append(String.format(
                    "High crop stress predicted — health score is critically low at %.0f%%. Immediate field inspection and remediation are required. ",
                    health
            ));
        }

        if (temperature > 36) {
            rec.append(String.format(
                    "Temperature stress alert: %.1f°C exceeds safe thresholds — consider shade netting or evening irrigation to reduce heat load. ",
                    temperature
            ));
        } else if (temperature < 18) {
            rec.append(String.format(
                    "Low temperature alert: %.1f°C may inhibit crop development — monitor for frost risk. ",
                    temperature
            ));
        }

        if (irrigation > 6) {
            rec.append(String.format(
                    "Apply %.1f mm of irrigation within the next 12 hours to restore adequate soil moisture. ",
                    irrigation
            ));
        } else if (irrigation > 0) {
            rec.append(String.format(
                    "Light irrigation of %.1f mm may be beneficial to maintain optimal moisture levels. ",
                    irrigation
            ));
        } else {
            rec.append("Current moisture levels are adequate — no irrigation is required at this time. ");
        }

        rec.append(String.format(
                "Projected harvest yield: %.2f t/ha.",
                predictedYield
        ));

        response.setRecommendation(rec.toString());

        return response;

    }

}
