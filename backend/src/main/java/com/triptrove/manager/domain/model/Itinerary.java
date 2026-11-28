package com.triptrove.manager.domain.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Entity
@Table(name = "itinerary")
public class Itinerary {
    @Id
    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @MapsId
    @OneToOne(optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(name = "time_zone")
    private String timeZone;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;

    @Column(name = "dates_changed_since_check", nullable = false)
    private boolean datesChangedSinceCheck;

    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItineraryDay> days = new ArrayList<>();

    protected Itinerary() {
    }

    public Itinerary(Trip trip) {
        this.trip = trip;
        resizeEmptyDays(trip.getFrom(), trip.getTo());
    }

    public void initializeTimeZone(String timeZone) {
        if (this.timeZone != null) {
            throw new IllegalStateException("Time zone already set for trip " + tripId);
        }
        this.timeZone = timeZone;
    }

    public void changeDateRange(LocalDate from, LocalDate to) {
        resizeEmptyDays(from, to);
        datesChangedSinceCheck = lastCheckedAt != null;
    }

    private void resizeEmptyDays(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("Invalid itinerary date range: " + from + " to " + to);
        }
        Predicate<ItineraryDay> outsideRange = day -> day.getDate().isBefore(from) || day.getDate().isAfter(to);
        days.stream().filter(outsideRange).filter(day -> day.getNote() != null).findFirst().ifPresent(day -> {
            throw new BaseApiException("Trip range would remove a day note on " + day.getDate(),
                    BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.TRIP_DATES_WITH_DAY_NOTE,
                    day.getDate());
        });
        days.removeIf(outsideRange);
        var existingDates = days.stream().map(ItineraryDay::getDate).collect(Collectors.toSet());
        from.datesUntil(to.plusDays(1))
                .filter(date -> !existingDates.contains(date))
                .forEach(date -> days.add(new ItineraryDay(this, date)));
    }
}
