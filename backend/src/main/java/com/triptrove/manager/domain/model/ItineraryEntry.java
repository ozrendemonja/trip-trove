package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Objects;

@Entity
@Table(name = "itinerary_entry")
public class ItineraryEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "attraction_id")
    @Getter
    private Long attractionId;

    @Embedded
    @Getter
    private ItineraryTypedItem typedItem;

    @Column(name = "item_changed_since_check", nullable = false)
    private boolean itemChangedSinceCheck;

    @Column(name = "path_position", nullable = false)
    private int position;

    @Embedded
    @Getter
    private ItineraryTiming timing;

    @Embedded
    @Getter
    private ItineraryTransfer outgoingTransfer;

    @Column(name = "transfer_changed_since_check", nullable = false)
    private boolean transferChangedSinceCheck;

    @Column(name = "group_changed_since_check", nullable = false)
    private boolean groupChangedSinceCheck;

    @Column(name = "fixed_start", nullable = false)
    @Getter
    private boolean fixedStart;

    @Column(name = "included_in_last_check", nullable = false)
    private boolean includedInLastCheck;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "watched_source_baseline", updatable = false)
    private WatchedSourceSnapshot watchedSourceBaseline;

    @Column(name = "start_changed_since_check", nullable = false)
    private boolean startChangedSinceCheck;

    @Column(name = "planned_length_changed_since_check", nullable = false)
    private boolean plannedLengthChangedSinceCheck;

    @Column(name = "fixed_start_changed_since_check", nullable = false)
    private boolean fixedStartChangedSinceCheck;

    @Column(name = "moved_since_check", nullable = false)
    private boolean movedSinceCheck;

    @Column(name = "following_starts_pushed_since_check", nullable = false)
    @Getter
    private boolean followingStartsPushedSinceCheck;

    protected ItineraryEntry() {
    }

    public ItineraryEntry(Long tripId, Long attractionId, int position, ItineraryTiming timing) {
        this.tripId = tripId;
        this.attractionId = attractionId;
        this.position = position;
        this.timing = timing;
    }

    public static ItineraryEntry forTypedItem(long tripId, ItineraryTypedItem item, int position,
                                               ItineraryTiming timing, boolean fixedStart) {
        if (item == null || timing.plannedMinutes() < 1) {
            throw new IllegalArgumentException("A typed item requires its own data and a positive planned length");
        }
        var entry = new ItineraryEntry(tripId, null, position, timing);
        entry.typedItem = item;
        entry.fixedStart = fixedStart;
        return entry;
    }

    public static ItineraryEntry fromGroup(long tripId, ItineraryGroupedAttraction member, int position,
                                           ItineraryTiming timing) {
        if (timing.plannedMinutes() != member.contributionMinutes()) {
            throw new IllegalArgumentException("Extraction must keep the grouped duration contribution");
        }
        var entry = new ItineraryEntry(tripId, member.getAttractionId(), position, timing);
        entry.watchedSourceBaseline = member.getWatchedSourceBaseline();
        entry.includedInLastCheck = member.isIncludedInLastCheck();
        return entry;
    }

    public void changeFixedStart(boolean fixed) {
        if (fixedStart != fixed) {
            fixedStart = fixed;
            fixedStartChangedSinceCheck = true;
        }
    }

    public void changeItemDetails(String name, String note) {
        if (typedItem == null) {
            throw new IllegalArgumentException("Only a typed entry has its own name and note");
        }
        var replacement = new ItineraryTypedItem(typedItem.kind(), name, note);
        if (!typedItem.equals(replacement)) {
            typedItem = replacement;
            itemChangedSinceCheck = true;
        }
    }

    public void changeOutgoingTransfer(ItineraryTransfer replacement) {
        if (!Objects.equals(outgoingTransfer, replacement)) {
            outgoingTransfer = replacement;
            transferChangedSinceCheck = true;
        }
    }

    public void markGroupChanged() {
        groupChangedSinceCheck = true;
    }

    public void moveTo(ItineraryTiming replacement, boolean pushedFollowingStarts) {
        retimeForMove(replacement);
        movedSinceCheck = true;
        followingStartsPushedSinceCheck |= pushedFollowingStarts;
    }

    public void retimeForMove(ItineraryTiming replacement) {
        if (replacement.plannedMinutes() != timing.plannedMinutes()) {
            throw new IllegalArgumentException("A move must keep the entry's planned length");
        }
        timing = replacement;
    }

    public void setPathPosition(int position) {
        this.position = position;
    }

    public void changeTiming(ItineraryTiming replacement) {
        if (!timing.date().equals(replacement.date()) || !timing.zone().equals(replacement.zone())) {
            throw new IllegalArgumentException("A timing edit must keep the entry's date and zone");
        }
        if (typedItem != null && replacement.plannedMinutes() < 1) {
            throw new IllegalArgumentException("A typed item must have a positive planned length");
        }
        if (!timing.start().equals(replacement.start())) {
            startChangedSinceCheck = true;
        }
        if (timing.plannedMinutes() != replacement.plannedMinutes()) {
            plannedLengthChangedSinceCheck = true;
        }
        timing = replacement;
    }
}
