package com.triptrove.manager.domain.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "itinerary")
public class Itinerary {
    @Id
    @Column(name = "trip_id")
    private Long tripId;

    @MapsId
    @OneToOne(optional = false)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "initial_zone")
    private String initialZone;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItineraryDay> days = new ArrayList<>();

    protected Itinerary() {
    }

    public Itinerary(Trip trip) {
        this.trip = trip;
        resizeEmptyDays(trip.getFrom(), trip.getTo());
    }

    public void resizeEmptyDays(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("Invalid itinerary date range: " + from + " to " + to);
        }
        days.removeIf(day -> day.getDate().isBefore(from) || day.getDate().isAfter(to));
        var existingDates = days.stream().map(ItineraryDay::getDate).collect(Collectors.toSet());
        from.datesUntil(to.plusDays(1))
                .filter(date -> !existingDates.contains(date))
                .forEach(date -> days.add(new ItineraryDay(this, date)));
    }
}
