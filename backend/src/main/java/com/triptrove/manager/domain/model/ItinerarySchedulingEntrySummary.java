package com.triptrove.manager.domain.model;

public record ItinerarySchedulingEntrySummary(long entryId, long attractionId, String name, int position,
                                               boolean fixedStart, ItineraryTiming timing, ItineraryTransfer outgoingTransfer) {
}
