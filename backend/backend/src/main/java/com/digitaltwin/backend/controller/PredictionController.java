package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class PredictionController {

    @Autowired
    private PredictionService predictionService;

    @GetMapping("/predict/{fieldId}")
public Map<String, Object> predict(@PathVariable Integer fieldId) {
    return predictionService.predict(fieldId);
}
}