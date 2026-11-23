package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;

import java.time.LocalDate;

@Entity
@Table(name = "itinerary_day")
@Getter(AccessLevel.PACKAGE)
public class ItineraryDay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Itinerary itinerary;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    protected ItineraryDay() {
    }

    ItineraryDay(Itinerary itinerary, LocalDate date) {
        this.itinerary = itinerary;
        this.date = date;
    }
}
