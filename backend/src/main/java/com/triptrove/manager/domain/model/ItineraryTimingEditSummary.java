package com.triptrove.manager.domain.model;

import java.time.LocalDate;

public record ItineraryTimingEditSummary(ItineraryEntry entry, String name, String visitDuration,
                                         LocalDate tripStart, LocalDate tripEnd) {
}
