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

    public List<ItineraryTransferRemovalSummary> transfersToRemoveForInsertionAt(int position) {
        var destination = entries.stream().filter(entry -> entry.position() == position).findFirst();
        if (destination.isEmpty()) {
            return List.of();
        }
        var to = destination.get();
        return entries.stream()
                .filter(entry -> ItineraryTransfer.between(entry.outgoingTransfer(), to.entryId()) != null)
                .map(from -> new ItineraryTransferRemovalSummary(from.entryId(), from.name(), to.name(), from.outgoingTransfer()))
                .toList();
    }
}
