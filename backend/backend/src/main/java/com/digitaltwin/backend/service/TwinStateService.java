package com.digitaltwin.backend.service;

import com.digitaltwin.backend.entity.TwinState;
import com.digitaltwin.backend.repository.TwinStateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TwinStateService {

    @Autowired
    private TwinStateRepository twinStateRepository;

    public TwinState getLatestTwinState(Integer fieldId) {
        return twinStateRepository.findTopByFieldIdOrderByTwinIdDesc(fieldId);
    }
}
