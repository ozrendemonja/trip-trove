package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Trip;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Limit;
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
                DELETE FROM TripAttraction ta
                WHERE ta.trip.id = :tripId
                  AND ta.attraction.id = :attractionId
            """)
    int deleteTripAttraction(Long tripId, Long attractionId);

    @Query("""
            SELECT t FROM Trip t
            WHERE t.id > :#{#afterTrip.elementId} AND t.createdOn >= :#{#afterTrip.updatedOn}
            ORDER BY t.createdOn ASC
            """)
    List<Trip> findOldestAfter(ScrollPosition afterTrip, Limit limit);

    @Query("""
            SELECT t FROM Trip t
            WHERE t.id < :#{#beforeTrip.elementId} AND t.createdOn <= :#{#beforeTrip.updatedOn}
            ORDER BY t.createdOn DESC
            """)
    List<Trip> findNewestBefore(ScrollPosition beforeTrip, Limit limit);

    @Query("""
            SELECT t FROM Trip t
            ORDER BY t.createdOn ASC
            """)
    List<Trip> findAllOrderByOldest(Limit limit);

    @Query("""
            SELECT t FROM Trip t
            ORDER BY t.createdOn DESC
            """)
    List<Trip> findAllOrderByNewest(Limit limit);

}