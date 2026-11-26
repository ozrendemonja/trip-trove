package com.triptrove.manager.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ItineraryDetails(Long tripId, String timeZone, Instant lastCheckedAt, List<Day> days,
                               List<UnscheduledAttractionSummary> unscheduledAttractions,
                               List<ChangeNoticeSummary> changeNotices, String checkContext) {
    public CheckState checkState() {
        if (lastCheckedAt == null) {
            return CheckState.NOT_YET_CHECKED;
        }
        return changeNotices.isEmpty() ? CheckState.MANUALLY_CHECKED : CheckState.CHANGED_SINCE_LAST_CHECK;
    }

    public enum CheckState {
        NOT_YET_CHECKED, MANUALLY_CHECKED, CHANGED_SINCE_LAST_CHECK
    }

    public record ChangeNoticeSummary(Long entryId, String subject, LocalDate date, List<Reason> reasons,
                                      SourceBaseline sourceBaseline, List<WatchedSourceChangeSummary> sourceChanges) {
        public enum Reason {
            ATTRACTION_ADDED, START_CHANGED, PLANNED_LENGTH_CHANGED, FIXED_START_CHANGED,
            ENTRY_MOVED, ENTRY_REMOVED, FOLLOWING_STARTS_PUSHED, ATTRACTION_EXCLUDED, REMOVED_FROM_TRIP
        }

        public enum SourceBaseline {
            WHEN_SCHEDULED, AT_LAST_CHECK
        }
    }

    public record Day(Long id, LocalDate date, String note, List<AttractionEntrySummary> entries) {
    }

    public record AttractionEntrySummary(long entryId, long attractionId, String name, TripAttractionGroup attractionGroup,
                                         boolean mustVisit, AttractionCategory category, int position,
                                         boolean fixedStart, ItineraryTiming timing,
                                         String workingHours, String visitDuration, String tripNote) {
    }

    public record UnscheduledAttractionSummary(Long attractionId, String name, String place,
                                               TripAttractionGroup attractionGroup, boolean mustVisit,
                                               AttractionCategory category, String workingHours, String visitDuration,
                                               String tripNote) {
    }
}
