package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.VisitedAttraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VisitedAttractionRepo extends JpaRepository<VisitedAttraction, Long> {
    boolean existsByTripIdAndAttractionId(Long tripId, Long attractionId);

    @Query("""
                SELECT COUNT(DISTINCT va.attraction.country)
                FROM VisitedAttraction va
                WHERE va.attraction.mustVisit = true
            """)
    int countDistinctVisitedCountries();
}