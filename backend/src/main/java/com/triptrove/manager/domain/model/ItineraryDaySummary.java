package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.OptionalInt;

public record ItineraryDaySummary(LocalDate date, List<ItinerarySchedulingEntrySummary> entries) {
    private static final Comparator<ItineraryTiming> TIMELINE_ORDER = Comparator
            .comparing((ItineraryTiming timing) -> timing.start().toInstant())
            .thenComparingInt(ItineraryTiming::plannedMinutes);

    public int lastPosition() {
        return entries.stream().mapToInt(ItinerarySchedulingEntrySummary::position).max().orElse(0);
    }

    public OptionalInt firstPositionAfter(ItineraryTiming proposedInterval) {
        return entries.stream()
                .filter(entry -> TIMELINE_ORDER.compare(entry.timing(), proposedInterval) > 0)
                .mapToInt(ItinerarySchedulingEntrySummary::position).min();
    }
}
