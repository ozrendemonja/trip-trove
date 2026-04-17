package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "trip_attraction",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_trip_attraction",
                        columnNames = {"trip_id", "attraction_id"}
                )
        }
)
@EntityListeners(AuditingEntityListener.class)
public class TripAttraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(name = "created_on", updatable = false, nullable = false)
    private LocalDateTime createdOn;

    @LastModifiedDate
    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @ManyToOne(optional = false)
    @JoinColumn(name = "attraction_id", nullable = false)
    private Attraction attraction;

    @ManyToOne(optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TripAttractionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "rating")
    private Rating rating;

    @Column(name = "note", length = 512)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "attraction_group")
    private TripAttractionGroup attractionGroup;

    @Column(name = "plan_note", length = 512)
    private String planNote;

    @Column(name = "must_visit", nullable = false)
    private boolean mustVisit;

    @Column(name = "working_hours", length = 128)
    private String workingHours;

    @Column(name = "visit_time", length = 64)
    private String visitTime;

    public void recordVisit(Rating rating, String note) {
        this.rating = rating;
        this.note = note;
        this.status = TripAttractionStatus.VISITED;
    }
}
