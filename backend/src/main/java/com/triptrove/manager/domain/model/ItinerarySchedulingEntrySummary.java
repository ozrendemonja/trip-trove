package com.triptrove.manager.domain.model;

public record ItinerarySchedulingEntrySummary(long entryId, Long attractionId, String name, int position,
                                               boolean fixedStart, ItineraryTiming timing, ItineraryTransfer outgoingTransfer) {
}
