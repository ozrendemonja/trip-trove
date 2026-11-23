package com.triptrove.manager.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ItineraryDetails(Long tripId, String timeZone, Instant lastCheckedAt, List<Day> days,
                               List<UnscheduledAttractionSummary> unscheduledAttractions) {
    public record Day(Long id, LocalDate date, List<AttractionEntrySummary> entries) {
    }

    public record AttractionEntrySummary(long entryId, long attractionId, String name, TripAttractionGroup attractionGroup,
                                         boolean mustVisit, AttractionCategory category, int position,
                                         boolean fixedStart, ItineraryTiming timing) {
    }

    public record UnscheduledAttractionSummary(Long attractionId, String name, String place,
                                               TripAttractionGroup attractionGroup, boolean mustVisit,
                                               AttractionCategory category, String workingHours, String visitDuration) {
    }
}
