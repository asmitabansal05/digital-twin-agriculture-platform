package com.digitaltwin.backend.service;

import com.digitaltwin.backend.entity.Prediction;
import com.digitaltwin.backend.entity.SensorReading;
import com.digitaltwin.backend.repository.PredictionRepository;
import com.digitaltwin.backend.repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class PredictionService {

    @Autowired
    private PredictionRepository predictionRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private AIService aiService;

    public Map<String, Object> predict(Integer fieldId) {

    SensorReading sensor =
            sensorReadingRepository.findTopByFieldIdOrderByReadingIdDesc(fieldId);

    Map<String, Object> result = aiService.getPrediction(
            sensor.getTemperature(),
            sensor.getHumidity(),
            sensor.getRainfall()
    );

    Prediction prediction = new Prediction();

    prediction.setFieldId(fieldId);
    prediction.setPredictedMoisture(
            ((Number) result.get("predicted_moisture")).doubleValue()
    );
    prediction.setPredictedYield(0.0);
    prediction.setRecommendation(
            result.get("recommendation").toString()
    );

    predictionRepository.save(prediction);

    return result;
}
}