package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.ItineraryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;

public interface ItineraryEntryRepo extends JpaRepository<ItineraryEntry, Long> {
    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.includedInLastCheck = true
            WHERE entry.tripId = :tripId AND entry.includedInLastCheck = false
            """)
    void markEntriesIncludedInLastCheck(Long tripId);

    @Modifying
    @Query("""
            UPDATE ItineraryEntry entry SET entry.position = entry.position + :offset
            WHERE entry.tripId = :tripId AND entry.timing.date = :date AND entry.position >= :fromPosition
            """)
    void shiftPositionsFrom(Long tripId, LocalDate date, int fromPosition, int offset);
}
