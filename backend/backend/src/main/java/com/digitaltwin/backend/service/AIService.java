package com.digitaltwin.backend.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIService {

    public Map<String, Object> getPrediction(double temperature,
                                double humidity,
                                double rainfall) {

        RestTemplate restTemplate = new RestTemplate();

        String url = "http://127.0.0.1:8000/predict";

        Map<String, Object> request = new HashMap<>();
        request.put("temperature", temperature);
        request.put("humidity", humidity);
        request.put("rainfall", rainfall);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(request, headers);

        ResponseEntity<Map> response =
        restTemplate.postForEntity(url, entity, Map.class);

        return response.getBody();
    }
}