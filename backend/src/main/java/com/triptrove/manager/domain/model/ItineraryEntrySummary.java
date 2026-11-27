package com.triptrove.manager.domain.model;

import java.time.LocalDate;

public record ItineraryEntrySummary(Long attractionId, LocalDate date, int position, ItineraryTiming timing) {
}
