package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "itinerary_entry")
public class ItineraryEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "attraction_id", nullable = false)
    private Long attractionId;

    @Column(name = "path_position", nullable = false)
    private int position;

    @Embedded
    @Getter
    private ItineraryTiming timing;

    @Column(name = "fixed_start", nullable = false)
    @Getter
    private boolean fixedStart;

    @Column(name = "included_in_last_check", nullable = false)
    private boolean includedInLastCheck;

    @Column(name = "start_changed_since_check", nullable = false)
    private boolean startChangedSinceCheck;

    @Column(name = "planned_length_changed_since_check", nullable = false)
    private boolean plannedLengthChangedSinceCheck;

    @Column(name = "fixed_start_changed_since_check", nullable = false)
    private boolean fixedStartChangedSinceCheck;

    protected ItineraryEntry() {
    }

    public ItineraryEntry(Long tripId, Long attractionId, int position, ItineraryTiming timing) {
        this.tripId = tripId;
        this.attractionId = attractionId;
        this.position = position;
        this.timing = timing;
    }

    public void changeFixedStart(boolean fixed) {
        if (fixedStart != fixed) {
            fixedStart = fixed;
            fixedStartChangedSinceCheck = true;
        }
    }

    public void changeTiming(ItineraryTiming replacement) {
        if (!timing.date().equals(replacement.date()) || !timing.zone().equals(replacement.zone())) {
            throw new IllegalArgumentException("A timing edit must keep the entry's date and zone");
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
