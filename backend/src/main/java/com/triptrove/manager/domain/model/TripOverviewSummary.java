package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TripOverviewSummary(Long id, String name, LocalDate from, LocalDate to, LocalDateTime changedOn,
                                  boolean archived, boolean hasItineraryEntries, boolean hasItineraryDayNotes) {
}
