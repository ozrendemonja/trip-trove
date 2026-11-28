package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
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
    @Getter
    private long attractionId;

    @Column(name = "host_entry_id", nullable = false)
    private long hostEntryId;

    @Column(name = "member_position", nullable = false)
    private int position;

    @Column(name = "contribution_minutes", nullable = false)
    private int contributionMinutes;

    @Column(name = "included_in_last_check", nullable = false)
    @Getter
    private boolean includedInLastCheck;

    @Column(name = "joined_since_last_check", nullable = false)
    private boolean joinedSinceLastCheck;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "watched_source_baseline", insertable = false, updatable = false, nullable = false)
    @Getter
    private WatchedSourceSnapshot watchedSourceBaseline;

    protected ItineraryGroupedAttraction() {
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public int contributionMinutes() {
        return contributionMinutes;
    }

    public void changeContributionMinutes(int minutes) {
        if (minutes < 0) {
            throw new IllegalArgumentException("A grouped duration contribution must be non-negative");
        }
        contributionMinutes = minutes;
    }

    public void moveToHost(long hostEntryId, int position) {
        this.hostEntryId = hostEntryId;
        this.position = position;
    }
}
