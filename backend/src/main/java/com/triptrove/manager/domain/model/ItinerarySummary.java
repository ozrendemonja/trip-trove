package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

public record ItinerarySummary(LocalDate tripStart, LocalDate tripEnd, String timeZone, List<ItineraryDaySummary> days) {
    private static final Comparator<ItinerarySchedulingEntrySummary> FIXED_START_FIRST =
            Comparator.comparing(ItinerarySchedulingEntrySummary::fixedStart, Comparator.reverseOrder());
    private static final Comparator<ItinerarySchedulingEntrySummary> EARLIEST_START_FIRST =
            Comparator.comparing(entry -> entry.timing().start().toInstant());
    private static final Comparator<ItinerarySchedulingEntrySummary> LOWEST_POSITION_FIRST =
            Comparator.comparingInt(ItinerarySchedulingEntrySummary::position);

    public Optional<ItineraryDaySummary> findDay(LocalDate date) {
        return days.stream().filter(day -> day.date().equals(date)).findFirst();
    }

    public boolean isAlreadyScheduled(long attractionId) {
        return entries().anyMatch(entry -> entry.attractionId() == attractionId);
    }

    public Optional<ItinerarySchedulingEntrySummary> findOverlap(ItineraryTiming proposedInterval) {
        // A conflict with a fixed start must name that entry, so fixed starts come first.
        return entries()
                .filter(entry -> proposedInterval.overlaps(entry.timing()))
                .min(FIXED_START_FIRST
                        .thenComparing(EARLIEST_START_FIRST)
                        .thenComparing(LOWEST_POSITION_FIRST));
    }

    private Stream<ItinerarySchedulingEntrySummary> entries() {
        return days.stream().flatMap(day -> day.entries().stream());
    }
}
