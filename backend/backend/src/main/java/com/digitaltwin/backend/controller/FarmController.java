package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.entity.Farm;
import com.digitaltwin.backend.service.FarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import org.springframework.web.bind.annotation.PathVariable;
import com.digitaltwin.backend.dto.DashboardResponse;

@RestController
public class FarmController {

    @Autowired
    private FarmService farmService;

    @GetMapping("/farms")
    public List<Farm> getAllFarms() {
        return farmService.getAllFarms();
    }

    @GetMapping("/farms/{id}")
public Farm getFarmById(@PathVariable Integer id) {
    return farmService.getFarmById(id);
}

@GetMapping("/dashboard/{farmId}")
public DashboardResponse getDashboard(@PathVariable Integer farmId) {
    return farmService.getDashboard(farmId);
}
}