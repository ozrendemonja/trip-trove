package com.triptrove.manager.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "itinerary_entry")
public class ItineraryEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "attraction_id", nullable = false)
    private Long attractionId;

    @Column(name = "path_position", nullable = false)
    private int position;

    @Embedded
    private ItineraryTiming timing;

    @Column(name = "fixed_start", nullable = false)
    private boolean fixedStart;

    protected ItineraryEntry() {
    }

    public ItineraryEntry(Long tripId, Long attractionId, int position, ItineraryTiming timing) {
        this.tripId = tripId;
        this.attractionId = attractionId;
        this.position = position;
        this.timing = timing;
    }
}
