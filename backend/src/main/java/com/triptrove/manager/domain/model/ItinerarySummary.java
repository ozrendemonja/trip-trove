package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

public record ItinerarySummary(LocalDate tripStart, LocalDate tripEnd, String timeZone, List<ItineraryDaySummary> days) {
    public Optional<ItineraryDaySummary> findDay(LocalDate date) {
        return days.stream().filter(day -> day.date().equals(date)).findFirst();
    }

    public boolean isAlreadyScheduled(long attractionId) {
        return entries().anyMatch(entry -> entry.attractionId() == attractionId);
    }

    public boolean hasOverlap(ItineraryTiming proposedInterval) {
        return entries().anyMatch(entry -> proposedInterval.overlaps(entry.timing()));
    }

    private Stream<ItineraryEntrySummary> entries() {
        return days.stream().flatMap(day -> day.entries().stream());
    }
}
