package com.digitaltwin.backend.service;

import com.digitaltwin.backend.dto.AnalyticsDayData;
import com.digitaltwin.backend.entity.SensorReading;
import com.digitaltwin.backend.repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * AnalyticsService — Performance-Optimised Edition
 *
 * BEFORE (42 sequential Python process spawns):
 *   for each of 14 readings:
 *       spawn python predict.py            → ~6.5s
 *       spawn python predict_yield.py      → ~6.5s
 *       spawn python predict_irrigation.py → ~6.5s
 *   Total: 14 × 3 × ~6.5s ≈ 273 seconds per request
 *
 * AFTER (1 batch Python process spawn):
 *   Collect all 14 readings into a JSON array
 *   spawn python predict_batch.py once     → ~7s
 *       loads all 3 models once at process start
 *       runs model.predict(df) once per model (vectorised over all 14 rows)
 *       returns JSON array of {healthScore, predictedYield, irrigationRequirement}
 *   Total: ~7 seconds per request  (≈39× faster)
 *
 * + Spring @Cacheable (15-second TTL via Caffeine):
 *   Subsequent requests within 15s return from JVM heap in < 5ms.
 *   Cache expires after 15s so fresh data is fetched on the next poll.
 *
 * JSON parsing uses only java.lang / java.util — no external library dependency.
 * The output format from predict_batch.py is fully known and stable.
 *
 * UNCHANGED:
 *   - GET /analytics/{fieldId} endpoint (AnalyticsController)
 *   - AnalyticsDayData DTO structure
 *   - DB query (findTop14ByFieldIdOrderByReadingIdDesc)
 *   - Date label logic
 *   - MLPredictionService / YieldPredictionService / IrrigationPredictionService
 *     (still used unchanged by FarmService and SimulationService)
 */
@Service
public class AnalyticsService {

    private static final String BATCH_SCRIPT_PATH =
            "ml/predict_batch.py";

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("MMM d");

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    /**
     * Returns up to 14 analytics data points for the given field,
     * each with real sensor values + ML predictions.
     *
     * Cached for 15 seconds (Caffeine). The 10-second frontend poll will hit
     * the cache for 1 poll cycle, then re-invoke the batch script on the next
     * cache miss, keeping data fresh while eliminating request pile-up.
     */
    @Cacheable(value = "analyticsCache", key = "#fieldId")
    public List<AnalyticsDayData> getAnalytics(Integer fieldId) {

        // ── 1. Fetch latest 14 sensor readings from PostgreSQL ──────────────
        List<SensorReading> readings =
                sensorReadingRepository.findTop14ByFieldIdOrderByReadingIdDesc(fieldId);

        if (readings == null || readings.isEmpty()) {
            return Collections.emptyList();
        }

        // Reverse: oldest reading → index 0 (left edge of chart)
        Collections.reverse(readings);

        // ── 2. Build JSON input array for predict_batch.py ──────────────────
        //    Column order matches training features: temperature, humidity,
        //    soil_moisture, rainfall  (see ml/train_model.py)
        StringBuilder jsonInput = new StringBuilder("[");
        for (int i = 0; i < readings.size(); i++) {
            SensorReading r = readings.get(i);
            double temp      = r.getTemperature()  != null ? r.getTemperature()  : 25.0;
            double humidity  = r.getHumidity()     != null ? r.getHumidity()     : 60.0;
            double soilMoist = r.getSoilMoisture() != null ? r.getSoilMoisture() : 50.0;
            double rainfall  = r.getRainfall()     != null ? r.getRainfall()     : 0.0;
            if (i > 0) jsonInput.append(",");
            jsonInput.append(String.format(
                    "{\"temperature\":%.4f,\"humidity\":%.4f,\"soil_moisture\":%.4f,\"rainfall\":%.4f}",
                    temp, humidity, soilMoist, rainfall
            ));
        }
        jsonInput.append("]");

        // ── 3. Run ONE Python process for all 14 readings × 3 models ────────
        double[] healthArr     = new double[readings.size()];
        double[] yieldArr      = new double[readings.size()];
        double[] irrigationArr = new double[readings.size()];
        // Fill with fallback values in case the batch call fails
        for (int i = 0; i < readings.size(); i++) {
            healthArr[i] = yieldArr[i] = irrigationArr[i] = -1.0;
        }
        runBatchPrediction(jsonInput.toString(), healthArr, yieldArr, irrigationArr);

        // ── 4. Assemble AnalyticsDayData list ───────────────────────────────
        List<AnalyticsDayData> result = new ArrayList<>();

        for (int i = 0; i < readings.size(); i++) {
            SensorReading r = readings.get(i);

            // Sensor values (same defaults as original code)
            double temp      = r.getTemperature()  != null ? r.getTemperature()  : 25.0;
            double humidity  = r.getHumidity()     != null ? r.getHumidity()     : 60.0;
            double soilMoist = r.getSoilMoisture() != null ? r.getSoilMoisture() : 50.0;
            double rainfall  = r.getRainfall()     != null ? r.getRainfall()     : 0.0;

            // Date label (unchanged from original logic)
            String label;
            if (r.getReadingTime() != null) {
                label = r.getReadingTime().format(DATE_FMT);
            } else if (r.getReadingId() != null) {
                label = "Rdg " + r.getReadingId();
            } else {
                label = "Day " + (i + 1);
            }

            AnalyticsDayData day = new AnalyticsDayData();
            day.setReadingId(r.getReadingId() != null ? r.getReadingId() : i);
            day.setDate(label);
            day.setTemperature(round2(temp));
            day.setHumidity(round2(humidity));
            day.setSoilMoisture(round2(soilMoist));
            day.setRainfall(round2(rainfall));
            day.setHealthScore(round2(healthArr[i]));
            day.setPredictedYield(round2(yieldArr[i]));
            day.setIrrigationRequirement(round2(irrigationArr[i]));

            result.add(day);
        }

        return result;
    }

    /**
     * Spawns predict_batch.py ONCE, passes all sensor rows as a JSON array via
     * stdin, reads back the JSON prediction array from stdout, and populates
     * the three output arrays in-place.
     *
     * JSON is parsed with plain Java — no external library dependency.
     * predict_batch.py always outputs exactly:
     *   [{"healthScore":X,"predictedYield":Y,"irrigationRequirement":Z}, ...]
     * where X,Y,Z are numeric (int or float).
     *
     * On any failure the output arrays retain their -1.0 fallback values.
     */
    private void runBatchPrediction(String jsonInput,
                                    double[] healthOut,
                                    double[] yieldOut,
                                    double[] irrigationOut) {
        try {
            // Spawn predict_batch.py — ONE process for ALL rows + ALL models
            ProcessBuilder pb = new ProcessBuilder("python", BATCH_SCRIPT_PATH);
            // Python's stderr flows to the Spring Boot console for visibility
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);
            Process process = pb.start();

            // Write JSON input to the process's stdin, then close stdin
            try (OutputStream stdin = process.getOutputStream()) {
                stdin.write(jsonInput.getBytes(StandardCharsets.UTF_8));
            }

            // Read JSON output from stdout
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                System.err.println("[AnalyticsService] predict_batch.py exited with code " + exitCode);
                return;
            }

            String jsonOutput = output.toString().trim();
            if (jsonOutput.isEmpty() || !jsonOutput.startsWith("[")) {
                System.err.println("[AnalyticsService] predict_batch.py returned unexpected output: "
                        + jsonOutput.substring(0, Math.min(100, jsonOutput.length())));
                return;
            }

            // ── Parse JSON array without external library ───────────────────
            // Format is always: [{"healthScore":X,"predictedYield":Y,"irrigationRequirement":Z},...]
            // Split on object boundaries — each object is between { and }
            String inner = jsonOutput.substring(1, jsonOutput.length() - 1).trim();
            if (inner.isEmpty()) return;

            // Split by },{  to get individual object strings
            String[] objects = inner.split("\\},\\s*\\{");
            for (int i = 0; i < objects.length && i < healthOut.length; i++) {
                String obj = objects[i].replace("{", "").replace("}", "");
                healthOut[i]     = extractDouble(obj, "healthScore",           -1.0);
                yieldOut[i]      = extractDouble(obj, "predictedYield",        -1.0);
                irrigationOut[i] = extractDouble(obj, "irrigationRequirement", -1.0);
            }

        } catch (Exception e) {
            System.err.println("[AnalyticsService] Batch prediction failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Extracts a numeric value from a simplified JSON fragment like:
     *   "healthScore":85.4,"predictedYield":6.12,...
     * Returns defaultVal if the key is not found or parsing fails.
     */
    private double extractDouble(String fragment, String key, double defaultVal) {
        String search = "\"" + key + "\":";
        int idx = fragment.indexOf(search);
        if (idx < 0) return defaultVal;
        int start = idx + search.length();
        int end = fragment.indexOf(",", start);
        String numStr = (end < 0 ? fragment.substring(start) : fragment.substring(start, end)).trim();
        try {
            return Double.parseDouble(numStr);
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
