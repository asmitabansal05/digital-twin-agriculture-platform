package com.digitaltwin.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class YieldPredictionService {

    @Value("${ML_API_URL:http://localhost:5000}")
    private String mlApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public double predictYield(
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

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    mlApiUrl + "/predict/yield",
                    request,
                    Map.class
            );

            return ((Number) response.getBody().get("prediction")).doubleValue();

        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }
}