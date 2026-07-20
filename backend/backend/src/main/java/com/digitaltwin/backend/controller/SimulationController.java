package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.entity.SimulationRequest;
import com.digitaltwin.backend.entity.SimulationResponse;
import com.digitaltwin.backend.service.SimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class SimulationController {

    @Autowired
    private SimulationService simulationService;

    @PostMapping("/simulate")
    public SimulationResponse simulate(
            @RequestBody SimulationRequest request
    ) {

        return simulationService.simulate(request);

    }

}