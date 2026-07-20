package com.digitaltwin.backend.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class MLPredictionService {

    public double predictHealth(
            double temperature,
            double humidity,
            double soilMoisture,
            double rainfall
    ) {

        try {

            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "C:\\Users\\ASMITA BANSAL\\Downloads\\DigitalTwinAgriculture\\ml\\predict.py",
                    String.valueOf(temperature),
                    String.valueOf(humidity),
                    String.valueOf(soilMoisture),
                    String.valueOf(rainfall)
            );

            // Merge stderr and stdout
            pb.redirectErrorStream(true);

            Process process = pb.start();

            BufferedReader reader =
                    new BufferedReader(
                            new InputStreamReader(process.getInputStream())
                    );

            String line;
            String lastLine = "";

            while ((line = reader.readLine()) != null) {
                System.out.println("PYTHON >> " + line);
                lastLine = line;
            }

            int exitCode = process.waitFor();

            System.out.println("Python Exit Code: " + exitCode);

            return Double.parseDouble(lastLine);

        }

        catch (Exception e) {

            System.out.println("========== ML Prediction Error ==========");
            e.printStackTrace();

            return -1;

        }

    }

}