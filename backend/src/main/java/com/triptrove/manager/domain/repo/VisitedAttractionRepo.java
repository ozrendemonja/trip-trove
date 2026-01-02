package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.VisitedAttraction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitedAttractionRepo extends JpaRepository<VisitedAttraction, Long> {
    boolean existsByTripIdAndAttractionId(Long tripId, Long attractionId);
}
