package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.AttractionVisit;
import com.triptrove.manager.domain.model.TripAttraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
                SELECT new com.triptrove.manager.domain.model.AttractionVisit(
                        ta.attraction.id,
                        ta.trip.id,
                        ta.trip.name,
                        ta.trip.from,
                        ta.trip.to,
                        ta.rating,
                        ta.reviewNote)
                FROM TripAttraction ta
                WHERE ta.status = com.triptrove.manager.domain.model.TripAttractionStatus.VISITED
                AND ta.attraction.id IN :attractionIds
                AND ta.trip.id <> :currentTripId
                ORDER BY ta.trip.to DESC
            """)
    List<AttractionVisit> findVisitHistory(@Param("attractionIds") List<Long> attractionIds,
                                           @Param("currentTripId") Long currentTripId);
}
