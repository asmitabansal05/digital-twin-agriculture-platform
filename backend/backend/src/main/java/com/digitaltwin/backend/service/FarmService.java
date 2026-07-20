package com.digitaltwin.backend.service;

import com.digitaltwin.backend.dto.DashboardResponse;
import com.digitaltwin.backend.entity.Farm;
import com.digitaltwin.backend.entity.Field;
import com.digitaltwin.backend.entity.SensorReading;
import com.digitaltwin.backend.entity.TwinState;
import com.digitaltwin.backend.repository.FarmRepository;
import com.digitaltwin.backend.repository.FieldRepository;
import com.digitaltwin.backend.repository.SensorReadingRepository;
import com.digitaltwin.backend.repository.TwinStateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FarmService {

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private FieldRepository fieldRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private TwinStateRepository twinStateRepository;

    @Autowired
    private MLPredictionService mlPredictionService;

    @Autowired
    private YieldPredictionService yieldPredictionService;

    @Autowired
    private IrrigationPredictionService irrigationPredictionService;

    public List<Farm> getAllFarms() {
        return farmRepository.findAll();
    }

    public Farm getFarmById(Integer id) {
        return farmRepository.findById(id).orElse(null);
    }

    public DashboardResponse getDashboard(Integer farmId) {

        Farm farm = farmRepository.findById(farmId).orElse(null);

        DashboardResponse dto = new DashboardResponse();

        if (farm == null) {
            return dto;
        }

        dto.setFarmName(farm.getFarm_name());

        List<Field> fields = fieldRepository.findByFarmId(farmId);

        dto.setTotalFields(fields.size());

        double totalTemp = 0;
        double totalHumidity = 0;
        double totalMoisture = 0;
        double totalRainfall = 0;

        double totalPredictedHealth = 0;
        double totalPredictedYield = 0;
        double totalWater = 0;

        String stressLevel = "Low";
        String fieldStatus = "Healthy";

        int count = 0;

        for (Field field : fields) {

            SensorReading sensor =
                    sensorReadingRepository.findTopByFieldIdOrderByReadingIdDesc(field.getField_id());

            TwinState twin =
                    twinStateRepository.findTopByFieldIdOrderByTwinIdDesc(field.getField_id());

            if (sensor != null) {

                totalTemp += sensor.getTemperature();
                totalHumidity += sensor.getHumidity();
                totalMoisture += sensor.getSoilMoisture();
                totalRainfall += sensor.getRainfall();

                // ===== ML Prediction =====

                double predictedHealth =
                        mlPredictionService.predictHealth(
                                sensor.getTemperature(),
                                sensor.getHumidity(),
                                sensor.getSoilMoisture(),
                                sensor.getRainfall()
                        );

                totalPredictedHealth += predictedHealth;


                double predictedYield =
                        yieldPredictionService.predictYield(
                               sensor.getTemperature(),
                               sensor.getHumidity(),
                               sensor.getSoilMoisture(),
                               sensor.getRainfall()
                        );

                totalPredictedYield += predictedYield;

                double predictedWater =
                        irrigationPredictionService.predictIrrigation(
                               sensor.getTemperature(),
                               sensor.getHumidity(),
                               sensor.getSoilMoisture(),
                               sensor.getRainfall()
                        );

                totalWater += predictedWater;


            }

            if (twin != null) {

    stressLevel = twin.getStressLevel();
    fieldStatus = twin.getFieldStatus();

}

            count++;

        }

        if (count > 0) {

            dto.setTemperature(totalTemp / count);
            dto.setHumidity(totalHumidity / count);
            dto.setSoilMoisture(totalMoisture / count);
            dto.setRainfall(totalRainfall / count);

            dto.setAverageMoisture(totalMoisture / count);

            // ML Prediction
            dto.setAverageHealth(totalPredictedHealth / count);

            dto.setPredictedYield(totalPredictedYield / count);

            dto.setWaterRequirement(totalWater / count);

        }

        dto.setStressLevel(stressLevel);
        dto.setFieldStatus(fieldStatus);

        return dto;

    }

}