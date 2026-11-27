package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.AttractionCategory;
import com.triptrove.manager.domain.model.ItineraryDetails.AttractionEntrySummary;
import com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary;
import com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary.SourceBaseline;
import com.triptrove.manager.domain.model.ItineraryDetails.EntryWarning;
import com.triptrove.manager.domain.model.ItineraryDetails.UnscheduledAttractionSummary;
import com.triptrove.manager.domain.model.ItineraryEntryRemoval;
import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.ItineraryTransfer;
import com.triptrove.manager.domain.model.ItineraryTransferSummary;
import com.triptrove.manager.domain.model.TripAttraction;
import com.triptrove.manager.domain.model.TripAttractionGroup;
import com.triptrove.manager.domain.model.VisitDuration;
import com.triptrove.manager.domain.model.WatchedSourceSnapshot;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary.Reason.*;

public record ItineraryAndBoardRow(Long tripId, String timeZone, Instant lastCheckedAt,
                                   Long itineraryDayId, LocalDate itineraryDate, String dayNote,
                                   Long attractionId, String attractionName, String cityName, String regionName, String countryName,
                                   TripAttractionGroup boardColumn, Boolean mustVisit, AttractionCategory category,
                                   String workingHours, String visitDuration, String tripNote, LocalDateTime permanentlyClosedAt,
                                   Long entryId, LocalDate entryDate, Integer entryPosition, Boolean entryFixedStart,
                                   ItineraryTiming entryTiming, Boolean entryIncludedInLastCheck,
                                   ItineraryTransfer entryTransfer, Boolean transferChangedSinceCheck,
                                   Boolean startChangedSinceCheck, Boolean plannedLengthChangedSinceCheck,
                                   Boolean fixedStartChangedSinceCheck, Boolean movedSinceCheck,
                                   Boolean followingStartsPushedSinceCheck,
                                   String removedSubject, LocalDate removedDate,
                                   Boolean removedEntryPushedFollowingStarts, ItineraryEntryRemoval.Cause removalCause,
                                   WatchedSourceSnapshot watchedSourceBaseline, WatchedSourceSnapshot currentWatchedSource,
                                   String checkContext) {
    boolean hasBoardAttraction() {
        return attractionId != null;
    }

    String boardPlaceName() {
        if (cityName != null) {
            return cityName;
        }
        return regionName != null ? regionName : countryName;
    }

    boolean isEligibleForItinerary() {
        return TripAttraction.isEligibleForScheduling(boardColumn, permanentlyClosedAt);
    }

    UnscheduledAttractionSummary toUnscheduledAttractionSummary(String place) {
        return new UnscheduledAttractionSummary(attractionId, attractionName, place, boardColumn, mustVisit,
                category, workingHours, visitDuration, tripNote);
    }

    AttractionEntrySummary toEntrySummary(Long nextEntryId) {
        if (entryTransfer != null && !entryTransfer.toEntryId().equals(nextEntryId)) {
            throw new IllegalStateException("Saved transfer does not connect neighbouring entries: " + entryId);
        }
        return new AttractionEntrySummary(entryId, attractionId, attractionName, boardColumn, mustVisit,
                category, entryPosition, entryFixedStart, entryTiming, workingHours, visitDuration, tripNote,
                entryTransfer == null ? null : new ItineraryTransferSummary(entryId, entryTransfer),
                entryWarnings(nextEntryId != null && entryTransfer == null));
    }

    private List<EntryWarning> entryWarnings(boolean missingTransfer) {
        var warnings = new ArrayList<EntryWarning>(3);
        if (permanentlyClosedAt != null) {
            warnings.add(EntryWarning.PERMANENTLY_CLOSED);
        }
        var sourceRange = VisitDuration.parse(visitDuration);
        if (sourceRange.isEmpty()) {
            warnings.add(EntryWarning.UNUSABLE_SOURCE_DURATION);
        } else if (!sourceRange.get().contains(entryTiming.plannedMinutes())) {
            warnings.add(EntryWarning.PLANNED_LENGTH_OUTSIDE_SOURCE_RANGE);
        }
        if (missingTransfer) {
            warnings.add(EntryWarning.MISSING_TRANSFER);
        }
        return List.copyOf(warnings);
    }

    ChangeNoticeSummary toChangeNotice(boolean hasBeenChecked) {
        var sourceChanges = currentWatchedSource.changesFrom(watchedSourceBaseline);
        SourceBaseline sourceBaseline = null;
        if (!sourceChanges.isEmpty()) {
            sourceBaseline = entryIncludedInLastCheck ? SourceBaseline.AT_LAST_CHECK : SourceBaseline.WHEN_SCHEDULED;
        }
        return new ChangeNoticeSummary(entryId, attractionName, entryDate,
                hasBeenChecked ? entryChangeReasons() : List.of(), sourceBaseline, sourceChanges);
    }

    private List<ChangeNoticeSummary.Reason> entryChangeReasons() {
        var reasons = new ArrayList<ChangeNoticeSummary.Reason>(7);
        if (!entryIncludedInLastCheck) {
            reasons.add(ATTRACTION_ADDED);
        }
        if (startChangedSinceCheck) {
            reasons.add(START_CHANGED);
        }
        if (plannedLengthChangedSinceCheck) {
            reasons.add(PLANNED_LENGTH_CHANGED);
        }
        if (fixedStartChangedSinceCheck) {
            reasons.add(FIXED_START_CHANGED);
        }
        if (movedSinceCheck) {
            reasons.add(ENTRY_MOVED);
        }
        if (followingStartsPushedSinceCheck) {
            reasons.add(FOLLOWING_STARTS_PUSHED);
        }
        if (transferChangedSinceCheck) {
            reasons.add(TRANSFER_CHANGED);
        }
        return List.copyOf(reasons);
    }

    ChangeNoticeSummary toRemovalNotice() {
        var reasons = new ArrayList<ChangeNoticeSummary.Reason>(3);
        reasons.add(ENTRY_REMOVED);
        switch (removalCause) {
            case ITINERARY -> { }
            case ATTRACTION_EXCLUDED -> reasons.add(ATTRACTION_EXCLUDED);
            case REMOVED_FROM_TRIP -> reasons.add(REMOVED_FROM_TRIP);
        }
        if (removedEntryPushedFollowingStarts) {
            reasons.add(FOLLOWING_STARTS_PUSHED);
        }
        return new ChangeNoticeSummary(null, removedSubject, removedDate, List.copyOf(reasons), null, List.of());
    }
}
