package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.entity.TwinState;
import com.digitaltwin.backend.service.TwinStateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class TwinStateController {

    @Autowired
    private TwinStateService twinStateService;

    @GetMapping("/twin-state/{fieldId}")
    public TwinState getLatestTwinState(@PathVariable Integer fieldId) {
        return twinStateService.getLatestTwinState(fieldId);
    }
}
