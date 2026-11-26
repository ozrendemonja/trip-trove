package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Immutable
@Table(name = "trip_attraction_watched_source")
public class TripAttractionWatchedSource {
    @Id
    @Column(name = "trip_attraction_id")
    private Long tripAttractionId;

    @Column(name = "trip_id")
    private Long tripId;

    @JdbcTypeCode(SqlTypes.JSON)
    private WatchedSourceSnapshot snapshot;
}
