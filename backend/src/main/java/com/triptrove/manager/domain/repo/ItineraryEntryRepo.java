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
    @Query(value = """
            UPDATE itinerary_entry entry SET included_in_last_check = true,
                start_changed_since_check = false, planned_length_changed_since_check = false,
                fixed_start_changed_since_check = false, moved_since_check = false,
                following_starts_pushed_since_check = false, watched_source_baseline = source.snapshot
            FROM trip_attraction_watched_source source
            WHERE entry.trip_id = :tripId AND source.trip_id = entry.trip_id AND source.attraction_id = entry.attraction_id
                AND (NOT entry.included_in_last_check OR entry.start_changed_since_check OR entry.planned_length_changed_since_check
                    OR entry.fixed_start_changed_since_check OR entry.moved_since_check
                    OR entry.watched_source_baseline IS DISTINCT FROM source.snapshot)
            """, nativeQuery = true)
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
