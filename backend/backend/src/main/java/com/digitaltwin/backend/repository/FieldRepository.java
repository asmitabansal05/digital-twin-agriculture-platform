package com.digitaltwin.backend.repository;

import com.digitaltwin.backend.entity.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FieldRepository extends JpaRepository<Field, Integer> {

    List<Field> findByFarmId(Integer farmId);
    long countByFarmId(Integer farmId);

}