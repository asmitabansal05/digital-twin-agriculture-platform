package com.digitaltwin.backend.service;

import com.digitaltwin.backend.dto.AnalyticsDayData;
import com.digitaltwin.backend.entity.SensorReading;
import com.digitaltwin.backend.repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AnalyticsService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("MMM d");

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Value("${ML_API_URL:http://localhost:5000}")
    private String mlApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Cacheable(value = "analyticsCache", key = "#fieldId")
    public List<AnalyticsDayData> getAnalytics(Integer fieldId) {

        List<SensorReading> readings =
                sensorReadingRepository.findTop14ByFieldIdOrderByReadingIdDesc(fieldId);

        if (readings == null || readings.isEmpty()) {
            return Collections.emptyList();
        }

        Collections.reverse(readings);

        List<AnalyticsDayData> result = new ArrayList<>();

        for (int i = 0; i < readings.size(); i++) {

            SensorReading r = readings.get(i);

            double temp = r.getTemperature() != null
                    ? r.getTemperature() : 25.0;

            double humidity = r.getHumidity() != null
                    ? r.getHumidity() : 60.0;

            double soilMoisture = r.getSoilMoisture() != null
                    ? r.getSoilMoisture() : 50.0;

            double rainfall = r.getRainfall() != null
                    ? r.getRainfall() : 0.0;

            double health = predict(
                    "/predict/health",
                    temp, humidity, soilMoisture, rainfall
            );

            double yield = predict(
                    "/predict/yield",
                    temp, humidity, soilMoisture, rainfall
            );

            double irrigation = predict(
                    "/predict/irrigation",
                    temp, humidity, soilMoisture, rainfall
            );

            String label;

            if (r.getReadingTime() != null) {
                label = r.getReadingTime().format(DATE_FMT);
            } else if (r.getReadingId() != null) {
                label = "Rdg " + r.getReadingId();
            } else {
                label = "Day " + (i + 1);
            }

            AnalyticsDayData day = new AnalyticsDayData();

            day.setReadingId(
                    r.getReadingId() != null
                            ? r.getReadingId()
                            : i
            );

            day.setDate(label);
            day.setTemperature(round2(temp));
            day.setHumidity(round2(humidity));
            day.setSoilMoisture(round2(soilMoisture));
            day.setRainfall(round2(rainfall));

            day.setHealthScore(round2(health));
            day.setPredictedYield(round2(yield));
            day.setIrrigationRequirement(round2(irrigation));

            result.add(day);
        }

        return result;
    }

    private double predict(
            String endpoint,
            double temperature,
            double humidity,
            double soilMoisture,
            double rainfall
    ) {

        try {

            Map<String, Object> body = new HashMap<>();

            body.put("temperature", temperature);
            body.put("humidity", humidity);
            body.put("soil_moisture", soilMoisture);
            body.put("rainfall", rainfall);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            mlApiUrl + endpoint,
                            request,
                            Map.class
                    );

            if (response.getBody() == null) {
                return -1;
            }

            Object prediction =
                    response.getBody().get("prediction");

            if (prediction instanceof Number) {
                return ((Number) prediction).doubleValue();
            }

        } catch (Exception e) {
            System.err.println(
                    "[AnalyticsService] ML prediction failed: "
                            + e.getMessage()
            );
        }

        return -1;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}