package com.digitaltwin.backend.repository;

import com.digitaltwin.backend.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FarmRepository extends JpaRepository<Farm, Integer> {
Optional<Farm> findById(Integer id);
}

