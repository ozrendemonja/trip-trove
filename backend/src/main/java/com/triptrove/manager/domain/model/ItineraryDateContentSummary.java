package com.triptrove.manager.domain.model;

import java.time.LocalDate;

public record ItineraryDateContentSummary(LocalDate tripFrom, LocalDate tripTo, LocalDate date, String dayNote,
                                          String entryName, ItineraryTiming timing) {
}
