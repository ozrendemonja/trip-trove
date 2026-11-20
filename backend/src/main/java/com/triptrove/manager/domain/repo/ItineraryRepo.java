package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Itinerary;
import com.triptrove.manager.domain.model.ItineraryDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ItineraryRepo extends JpaRepository<Itinerary, Long> {
    @Query("""
            SELECT itinerary FROM Itinerary itinerary
            LEFT JOIN FETCH itinerary.days
            WHERE itinerary.tripId = :tripId
            """)
    Optional<Itinerary> findWithDaysByTripId(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.repo.ItineraryRepo$DetailRow(
                itinerary.tripId, itinerary.initialZone, itinerary.lastCheckedAt, day.id, day.date)
            FROM Itinerary itinerary
            LEFT JOIN itinerary.days day
            WHERE itinerary.tripId = :tripId
            ORDER BY day.date
            """)
    List<DetailRow> findDetailRowsByTripId(Long tripId);

    default Optional<ItineraryDetails> findDetailsByTripId(Long tripId) {
        var rows = findDetailRowsByTripId(tripId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }

        var first = rows.getFirst();
        if (first.dayId() == null) {
            throw new IllegalStateException("Itinerary for trip " + tripId + " has no days");
        }
        var days = rows.stream().map(row -> new ItineraryDetails.Day(row.dayId(), row.date())).toList();
        return Optional.of(new ItineraryDetails(first.tripId(), first.initialZone(), first.lastCheckedAt(), days));
    }

    record DetailRow(Long tripId, String initialZone, Instant lastCheckedAt, Long dayId, LocalDate date) {
    }
}
