package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Trip;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface TripRepo extends JpaRepository<Trip, Long> {
    List<Trip> findByName(String tripName);

    @Query("""
                SELECT CASE WHEN EXISTS (
                    SELECT t
                    FROM Trip t
                    WHERE t.name = :name
                      AND (
                            t.from BETWEEN :startDate AND :endDate
                         OR t.to   BETWEEN :startDate AND :endDate
                      )
                ) THEN TRUE ELSE FALSE END
            """)
    boolean existsByNameAndDatesBetween(String name, LocalDate startDate, LocalDate endDate);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
                DELETE FROM VisitedAttraction va
                WHERE va.trip.id = :tripId
                  AND va.attraction.id = :attractionId
            """)
    int deleteVisitedAttraction(Long tripId, Long attractionId);
}