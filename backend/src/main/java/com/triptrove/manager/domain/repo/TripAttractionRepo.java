package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.TripAttraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TripAttractionRepo extends JpaRepository<TripAttraction, Long> {
    boolean existsByTripIdAndAttractionId(Long tripId, Long attractionId);

    Optional<TripAttraction> findByTripIdAndAttractionId(Long tripId, Long attractionId);

    List<TripAttraction> findByTripId(Long tripId);

    @Query("""
                SELECT COUNT(DISTINCT ta.attraction.country)
                FROM TripAttraction ta
                WHERE ta.attraction.mustVisit = true
                AND ta.status = VISITED
            """)
    int countDistinctVisitedCountries();
}
