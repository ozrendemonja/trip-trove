package com.triptrove.manager.domain.model;

import java.time.LocalDate;

public record ItineraryEntrySummary(long attractionId, LocalDate date, int position, ItineraryTiming timing) {
}
