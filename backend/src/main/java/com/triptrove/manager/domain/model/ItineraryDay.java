package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;

import java.time.LocalDate;

@Entity
@Table(name = "itinerary_day")
@Getter(AccessLevel.PACKAGE)
public class ItineraryDay {
    public static final int NOTE_MAX_LENGTH = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Itinerary itinerary;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "note", length = NOTE_MAX_LENGTH)
    private String note;

    protected ItineraryDay() {
    }

    ItineraryDay(Itinerary itinerary, LocalDate date) {
        this.itinerary = itinerary;
        this.date = date;
    }

    public void changeNote(String text) {
        if (text == null || text.length() > NOTE_MAX_LENGTH || text.indexOf('\0') >= 0) {
            throw new IllegalArgumentException("Invalid text for itinerary day note on " + date);
        }
        note = text.isEmpty() ? null : text;
    }
}
