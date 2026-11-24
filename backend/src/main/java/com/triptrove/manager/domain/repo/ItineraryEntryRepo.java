package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.ItineraryEntry;
import com.triptrove.manager.domain.model.ItineraryRemovalSummary;
import com.triptrove.manager.domain.model.ItineraryTimingEditSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ItineraryEntryRepo extends JpaRepository<ItineraryEntry, Long> {
    Optional<ItineraryEntry> findByIdAndTripId(Long id, Long tripId);

    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.includedInLastCheck = true,
                entry.startChangedSinceCheck = false, entry.plannedLengthChangedSinceCheck = false,
                entry.fixedStartChangedSinceCheck = false, entry.movedSinceCheck = false,
                entry.followingStartsPushedSinceCheck = false
            WHERE entry.tripId = :tripId AND (entry.includedInLastCheck = false
                OR entry.startChangedSinceCheck = true OR entry.plannedLengthChangedSinceCheck = true
                OR entry.fixedStartChangedSinceCheck = true OR entry.movedSinceCheck = true)
            """)
    void markEntriesChecked(Long tripId);

    @Modifying
    @Query("DELETE FROM ItineraryEntryRemoval removal WHERE removal.tripId = :tripId")
    void clearRemovalNoticesByTripId(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryTimingEditSummary(
                entry, attraction.name, item.visitTime, trip.from, trip.to, itinerary.timeZone)
            FROM ItineraryEntry entry
            JOIN Itinerary itinerary ON itinerary.tripId = entry.tripId
            JOIN Trip trip ON trip.id = entry.tripId
            JOIN TripAttraction item ON item.trip = trip AND item.attraction.id = entry.attractionId
            JOIN item.attraction attraction
            WHERE entry.tripId = :tripId
            ORDER BY entry.timing.date, entry.position
            """)
    List<ItineraryTimingEditSummary> findTimingEditSummariesByTripId(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryRemovalSummary(
                entry, attraction.name, itinerary.lastCheckedAt)
            FROM ItineraryEntry entry
            JOIN Itinerary itinerary ON itinerary.tripId = entry.tripId
            JOIN Attraction attraction ON attraction.id = entry.attractionId
            WHERE entry.tripId = :tripId AND entry.id = :entryId
            """)
    Optional<ItineraryRemovalSummary> findRemovalSummaryByTripIdAndEntryId(Long tripId, Long entryId);

    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.position = entry.position + :offset
            WHERE entry.tripId = :tripId AND entry.timing.date = :date AND entry.position >= :fromPosition
            """)
    void shiftPositionsFrom(Long tripId, LocalDate date, int fromPosition, int offset);
}
