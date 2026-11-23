package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.ItineraryEntry;
import com.triptrove.manager.domain.model.ItineraryTimingEditSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ItineraryEntryRepo extends JpaRepository<ItineraryEntry, Long> {
    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.includedInLastCheck = true,
                entry.startChangedSinceCheck = false, entry.plannedLengthChangedSinceCheck = false
            WHERE entry.tripId = :tripId AND (entry.includedInLastCheck = false
                OR entry.startChangedSinceCheck = true OR entry.plannedLengthChangedSinceCheck = true)
            """)
    void markEntriesChecked(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryTimingEditSummary(
                entry, attraction.name, item.visitTime, trip.from, trip.to)
            FROM ItineraryEntry entry
            JOIN Trip trip ON trip.id = entry.tripId
            JOIN TripAttraction item ON item.trip = trip AND item.attraction.id = entry.attractionId
            JOIN item.attraction attraction
            WHERE entry.tripId = :tripId
            ORDER BY entry.timing.date, entry.position
            """)
    List<ItineraryTimingEditSummary> findTimingEditSummariesByTripId(Long tripId);

    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.position = entry.position + :offset
            WHERE entry.tripId = :tripId AND entry.timing.date = :date AND entry.position >= :fromPosition
            """)
    void shiftPositionsFrom(Long tripId, LocalDate date, int fromPosition, int offset);
}
