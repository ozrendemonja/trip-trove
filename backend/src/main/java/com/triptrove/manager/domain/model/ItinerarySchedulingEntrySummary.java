package com.triptrove.manager.domain.model;

public record ItinerarySchedulingEntrySummary(long attractionId, String name, int position, boolean fixedStart,
                                               ItineraryTiming timing) {
}
