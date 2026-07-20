package com.digitaltwin.backend.controller;

import com.digitaltwin.backend.entity.Field;
import com.digitaltwin.backend.service.FieldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
public class FieldController {

    @Autowired
    private FieldService fieldService;

    @GetMapping("/fields")
    public List<Field> getAllFields() {
        return fieldService.getAllFields();
    }
    @GetMapping("/farms/{farm_id}/fields")
public List<Field> getFieldsByFarm(@PathVariable Integer farm_id) {
    return fieldService.getFieldsByFarm(farm_id);
}
}