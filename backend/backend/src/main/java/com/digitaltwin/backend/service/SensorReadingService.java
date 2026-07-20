package com.digitaltwin.backend.service;

import com.digitaltwin.backend.entity.SensorReading;
import com.digitaltwin.backend.repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SensorReadingService {

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    public SensorReading getLatestSensorReading(Integer fieldId) {
        return sensorReadingRepository.findTopByFieldIdOrderByReadingIdDesc(fieldId);
    }

    public List<SensorReading> getSensorHistory(Integer fieldId) {
        return sensorReadingRepository.findTop20ByFieldIdOrderByReadingIdDesc(fieldId);
    }
}