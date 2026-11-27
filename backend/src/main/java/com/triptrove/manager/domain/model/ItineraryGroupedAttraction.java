package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "itinerary_grouped_attraction")
public class ItineraryGroupedAttraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private long tripId;

    @Column(name = "attraction_id", nullable = false)
    private long attractionId;

    @Column(name = "host_entry_id", nullable = false)
    private long hostEntryId;

    @Column(name = "member_position", nullable = false)
    private int position;

    @Column(name = "contribution_minutes", nullable = false)
    private int contributionMinutes;

    @Column(name = "included_in_last_check", nullable = false)
    private boolean includedInLastCheck;

    @Column(name = "joined_since_last_check", nullable = false)
    private boolean joinedSinceLastCheck;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "watched_source_baseline", insertable = false, updatable = false, nullable = false)
    private WatchedSourceSnapshot watchedSourceBaseline;

    protected ItineraryGroupedAttraction() {
    }
}
