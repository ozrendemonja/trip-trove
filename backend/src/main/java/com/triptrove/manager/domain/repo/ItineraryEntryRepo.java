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
                following_starts_pushed_since_check = false, transfer_changed_since_check = false,
                group_changed_since_check = false, item_changed_since_check = false,
                watched_source_baseline = source.snapshot
            FROM (
                SELECT attraction_id, snapshot FROM trip_attraction_watched_source WHERE trip_id = :tripId
                UNION ALL SELECT NULL, NULL
            ) source
            WHERE entry.trip_id = :tripId AND entry.attraction_id IS NOT DISTINCT FROM source.attraction_id
                AND (NOT entry.included_in_last_check OR entry.start_changed_since_check OR entry.planned_length_changed_since_check
                    OR entry.fixed_start_changed_since_check OR entry.moved_since_check
                    OR entry.transfer_changed_since_check OR entry.group_changed_since_check OR entry.item_changed_since_check
                    OR entry.watched_source_baseline IS DISTINCT FROM source.snapshot)
            """, nativeQuery = true)
    void markEntriesChecked(Long tripId);

    @Modifying
    @Query(value = """
            INSERT INTO itinerary_grouped_attraction(trip_id, attraction_id, host_entry_id, member_position,
                contribution_minutes, included_in_last_check, watched_source_baseline)
            SELECT :tripId, :attractionId, :hostEntryId, :position, :minutes,
                COALESCE(source.included_in_last_check, false), source.watched_source_baseline
            FROM (VALUES (CAST(:sourceEntryId AS BIGINT))) AS requested(entry_id)
            LEFT JOIN itinerary_entry source ON source.id = requested.entry_id
                AND source.trip_id = :tripId AND source.attraction_id = :attractionId
            WHERE requested.entry_id IS NULL OR source.id IS NOT NULL
            """, nativeQuery = true)
    int addGroupedAttraction(long tripId, long attractionId, long hostEntryId, int position, int minutes,
                             Long sourceEntryId);

    @Modifying
    @Query(value = """
            UPDATE itinerary_grouped_attraction member
            SET included_in_last_check = true, joined_since_last_check = false, watched_source_baseline = source.snapshot
            FROM trip_attraction_watched_source source
            WHERE member.trip_id = :tripId
                AND source.trip_id = member.trip_id AND source.attraction_id = member.attraction_id
                AND (member.joined_since_last_check OR member.watched_source_baseline IS DISTINCT FROM source.snapshot)
            """, nativeQuery = true)
    void markGroupedAttractionsChecked(Long tripId);

    @Modifying
    @Query("DELETE FROM ItineraryEntryRemoval removal WHERE removal.tripId = :tripId")
    void clearRemovalNoticesByTripId(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryTimingEditSummary(
                entry, COALESCE(attraction.name, entry.typedItem.name), item.visitTime, trip.from, trip.to, itinerary.timeZone,
                COALESCE(members.lastPosition, 0), COALESCE(members.totalContribution, 0L))
            FROM ItineraryEntry entry
            JOIN Itinerary itinerary ON itinerary.tripId = entry.tripId
            JOIN Trip trip ON trip.id = entry.tripId
            LEFT JOIN TripAttraction item ON item.trip = trip AND item.attraction.id = entry.attractionId
            LEFT JOIN item.attraction attraction
            LEFT JOIN (
                SELECT member.hostEntryId AS hostId, MAX(member.position) AS lastPosition,
                    SUM(member.contributionMinutes) AS totalContribution
                FROM ItineraryGroupedAttraction member WHERE member.tripId = :tripId
                GROUP BY member.hostEntryId
            ) members ON members.hostId = entry.id
            WHERE entry.tripId = :tripId
            ORDER BY entry.timing.date, entry.position
            """)
    List<ItineraryTimingEditSummary> findTimingEditSummariesByTripId(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryRemovalSummary(
                entry, COALESCE(attraction.name, entry.typedItem.name), itinerary.lastCheckedAt, incoming,
                COALESCE(fromAttraction.name, incoming.typedItem.name), COALESCE(toAttraction.name, destination.typedItem.name),
                EXISTS (SELECT 1 FROM ItineraryGroupedAttraction member WHERE member.hostEntryId = entry.id))
            FROM ItineraryEntry entry
            JOIN Itinerary itinerary ON itinerary.tripId = entry.tripId
            LEFT JOIN Attraction attraction ON attraction.id = entry.attractionId
            LEFT JOIN ItineraryEntry incoming ON incoming.outgoingTransfer.toEntryId = entry.id
            LEFT JOIN Attraction fromAttraction ON fromAttraction.id = incoming.attractionId
            LEFT JOIN ItineraryEntry destination ON destination.id = entry.outgoingTransfer.toEntryId
            LEFT JOIN Attraction toAttraction ON toAttraction.id = destination.attractionId
            WHERE entry.tripId = :tripId AND entry.id = :entryId
            """)
    Optional<ItineraryRemovalSummary> findRemovalSummaryByTripIdAndEntryId(Long tripId, Long entryId);

    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.position = entry.position + :offset
            WHERE entry.tripId = :tripId AND entry.timing.date = :date AND entry.position >= :fromPosition
            """)
    void shiftPositionsFrom(Long tripId, LocalDate date, int fromPosition, int offset);

    @Modifying
    @Query(value = """
            UPDATE itinerary_entry SET transfer_to_entry_id = NULL, transfer_mode = NULL,
                transfer_minutes = NULL, transfer_note = NULL,
                transfer_changed_since_check = true
            WHERE trip_id = :tripId AND id = :fromEntryId AND transfer_to_entry_id = :toEntryId
            """, nativeQuery = true)
    int disconnectTransfer(long tripId, long fromEntryId, long toEntryId);
}
