package com.triptrove.manager.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ItineraryDetails(Long tripId, String initialZone, Instant lastCheckedAt, List<Day> days) {
    public record Day(Long id, LocalDate date) {
    }
}
