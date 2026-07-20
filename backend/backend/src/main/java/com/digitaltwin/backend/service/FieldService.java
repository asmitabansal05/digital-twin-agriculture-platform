package com.digitaltwin.backend.service;

import com.digitaltwin.backend.entity.Field;
import com.digitaltwin.backend.repository.FieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FieldService {

    @Autowired
    private FieldRepository fieldRepository;

    public List<Field> getAllFields() {
        return fieldRepository.findAll();
    }
    public List<Field> getFieldsByFarm(Integer farmId) {
    return fieldRepository.findByFarmId(farmId);
}
}