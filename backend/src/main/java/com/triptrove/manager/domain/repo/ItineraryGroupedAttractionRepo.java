package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.ItineraryGroupedAttraction;
import com.triptrove.manager.domain.model.ItineraryGroupedAttractionEditSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ItineraryGroupedAttractionRepo extends JpaRepository<ItineraryGroupedAttraction, Long> {
    List<ItineraryGroupedAttraction> findAllByTripIdAndHostEntryIdOrderByPosition(long tripId, long hostEntryId);

    @Query("""
            SELECT member.attractionId FROM ItineraryGroupedAttraction member
            WHERE member.tripId = :tripId AND member.hostEntryId = :hostEntryId
            """)
    List<Long> findAttractionIdsByTripIdAndHostEntryId(long tripId, long hostEntryId);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryGroupedAttractionEditSummary(member, attraction.name)
            FROM ItineraryGroupedAttraction member
            JOIN Attraction attraction ON attraction.id = member.attractionId
            WHERE member.tripId = :tripId AND member.hostEntryId = :hostEntryId AND member.attractionId = :attractionId
            """)
    Optional<ItineraryGroupedAttractionEditSummary> findEditSummaryByTripIdAndHostEntryIdAndAttractionId(
            long tripId, long hostEntryId, long attractionId);
}
