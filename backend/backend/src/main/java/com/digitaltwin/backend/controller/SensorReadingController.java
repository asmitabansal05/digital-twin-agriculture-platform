package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.entity.SensorReading;
import com.digitaltwin.backend.service.SensorReadingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SensorReadingController {

    @Autowired
    private SensorReadingService sensorReadingService;

    @GetMapping("/sensor-readings/{fieldId}")
    public SensorReading getLatestSensorReading(@PathVariable Integer fieldId) {
        return sensorReadingService.getLatestSensorReading(fieldId);
    }

    @GetMapping("/sensor-readings/history/{fieldId}")
    public List<SensorReading> getSensorHistory(@PathVariable Integer fieldId) {
        return sensorReadingService.getSensorHistory(fieldId);
    }
}