package com.digitaltwin.backend.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class IrrigationPredictionService {

    public double predictIrrigation(
            double temperature,
            double humidity,
            double soilMoisture,
            double rainfall
    ) {

        try {

            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "C:\\Users\\ASMITA BANSAL\\Downloads\\DigitalTwinAgriculture\\ml\\predict_irrigation.py",
                    String.valueOf(temperature),
                    String.valueOf(humidity),
                    String.valueOf(soilMoisture),
                    String.valueOf(rainfall)
            );

            pb.redirectErrorStream(true);

            Process process = pb.start();

            BufferedReader reader =
                    new BufferedReader(
                            new InputStreamReader(process.getInputStream())
                    );

            String line;
            String lastLine = "";

            while ((line = reader.readLine()) != null) {
                lastLine = line;
            }

            process.waitFor();

            return Double.parseDouble(lastLine);

        }
        catch (Exception e) {

            e.printStackTrace();

            return -1;

        }

    }

}
