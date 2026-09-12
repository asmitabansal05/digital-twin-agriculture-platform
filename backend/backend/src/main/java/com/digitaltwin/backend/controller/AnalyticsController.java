package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.dto.AnalyticsDayData;
import com.digitaltwin.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AnalyticsController
 *
 * Exposes:
 *   GET /analytics/{fieldId}
 *
 * Returns up to 14 data points, each containing:
 *   - date label
 *   - raw sensor values: temperature, humidity, soilMoisture, rainfall
 *   - ML predictions:    healthScore, predictedYield, irrigationRequirement
 *
 * The frontend field IDs (101, 102, 201, 301) are mapped to backend DB IDs
 * (1, 2, 3, 4) in the React layer — this controller only receives backend IDs.
 */
@RestController
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/analytics/{fieldId}")
    public List<AnalyticsDayData> getAnalytics(@PathVariable Integer fieldId) {
        return analyticsService.getAnalytics(fieldId);
    }
}
