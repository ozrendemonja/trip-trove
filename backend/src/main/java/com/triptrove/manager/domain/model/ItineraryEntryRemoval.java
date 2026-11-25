package com.triptrove.manager.domain.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "itinerary_entry_removal")
public class ItineraryEntryRemoval {
    public enum Cause {
        ITINERARY, ATTRACTION_EXCLUDED, REMOVED_FROM_TRIP
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String subject;

    @Column(name = "following_starts_pushed", nullable = false)
    private boolean followingStartsPushed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Cause cause;

    protected ItineraryEntryRemoval() {
    }

    public ItineraryEntryRemoval(Long tripId, LocalDate date, String subject, boolean followingStartsPushed, Cause cause) {
        this.tripId = tripId;
        this.date = date;
        this.subject = subject;
        this.followingStartsPushed = followingStartsPushed;
        this.cause = cause;
    }
}
