package com.digitaltwin.backend.repository;

import com.digitaltwin.backend.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;




public interface SensorReadingRepository extends JpaRepository<SensorReading, Integer> {

    SensorReading findTopByFieldIdOrderByReadingIdDesc(Integer fieldId);

    List<SensorReading> findTop20ByFieldIdOrderByReadingIdDesc(Integer fieldId);

}