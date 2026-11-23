package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.ItineraryEntry;
import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.ItineraryTimingEditSummary;
import com.triptrove.manager.domain.model.ItineraryTimingIssue;
import com.triptrove.manager.domain.model.VisitDuration;
import com.triptrove.manager.domain.repo.ItineraryEntryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ItineraryTimingEditor {
    private final ItineraryEntryRepo entries;

    public void updateItineraryEntryStart(long tripId, long entryId, LocalTime clock) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var editedEntry = findEntry(itinerary, tripId, entryId);
        var savedTiming = editedEntry.entry().getTiming();
        var newTiming = savedTiming.withLocalStart(clock);
        if (newTiming.start().equals(savedTiming.start())) {
            return;
        }
        applyNewTiming(itinerary, editedEntry, newTiming);
    }

    public void updateItineraryEntryEnd(long tripId, long entryId, LocalDate date, LocalTime clock) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var editedEntry = findEntry(itinerary, tripId, entryId);
        var savedTiming = editedEntry.entry().getTiming();
        var newTiming = savedTiming.withLocalEnd(date, clock);
        if (newTiming.plannedMinutes() == savedTiming.plannedMinutes()) {
            return;
        }
        validatePlannedLengthWithinVisitDuration(editedEntry, newTiming.plannedMinutes());
        applyNewTiming(itinerary, editedEntry, newTiming);
    }

    public void updateItineraryEntryPlannedLength(long tripId, long entryId, int minutes) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var editedEntry = findEntry(itinerary, tripId, entryId);
        var savedTiming = editedEntry.entry().getTiming();
        var newTiming = savedTiming.withPlannedMinutes(minutes);
        if (newTiming.plannedMinutes() == savedTiming.plannedMinutes()) {
            return;
        }
        validatePlannedLengthWithinVisitDuration(editedEntry, newTiming.plannedMinutes());
        applyNewTiming(itinerary, editedEntry, newTiming);
    }

    private static ItineraryTimingEditSummary findEntry(List<ItineraryTimingEditSummary> itinerary, long tripId,
                                                        long entryId) {
        return itinerary.stream().filter(entry -> entry.entry().getId() == entryId).findFirst()
                .orElseThrow(() -> new BaseApiException("Entry not found in trip", RESOURCE_NOT_FOUND, entryId, tripId));
    }

    private static void validatePlannedLengthWithinVisitDuration(ItineraryTimingEditSummary entry,
                                                                 int plannedMinutes) {
        var visitDuration = VisitDuration.parse(entry.visitDuration()).orElseThrow(() ->
                new BaseApiException("No valid source duration for edited entry", ITINERARY_PLANNED_LENGTH_NOT_ALLOWED,
                        ItineraryTimingIssue.MISSING_VISIT_DURATION, entry.name()));
        if (!visitDuration.contains(plannedMinutes)) {
            throw new BaseApiException("Replacement length outside source range", ITINERARY_PLANNED_LENGTH_NOT_ALLOWED,
                    entry.name(), entry.visitDuration());
        }
    }

    private static void applyNewTiming(List<ItineraryTimingEditSummary> itinerary,
                                       ItineraryTimingEditSummary editedEntry, ItineraryTiming newTiming) {
        var date = editedEntry.entry().getTiming().date();
        var entriesOfDay = entriesOn(itinerary, date);
        var entriesOfOtherDays = entriesNotOn(itinerary, date);

        validateStartsAfterPreviousEntry(entriesOfDay, editedEntry, newTiming);
        validateNewTiming(editedEntry, newTiming, entriesOfOtherDays);
        var pushedTimings = pushFollowingEntries(entriesOfDay, editedEntry, newTiming, entriesOfOtherDays);

        // Change timings only after every check passes, so a rejected edit changes nothing.
        editedEntry.entry().changeTiming(newTiming);
        pushedTimings.forEach(ItineraryEntry::changeTiming);
    }

    private static List<ItineraryTimingEditSummary> entriesOn(List<ItineraryTimingEditSummary> itinerary,
                                                              LocalDate date) {
        return itinerary.stream().filter(entry -> entry.entry().getTiming().date().equals(date)).toList();
    }

    private static List<ItineraryTimingEditSummary> entriesNotOn(List<ItineraryTimingEditSummary> itinerary,
                                                                 LocalDate date) {
        return itinerary.stream().filter(entry -> !entry.entry().getTiming().date().equals(date)).toList();
    }

    private static void validateStartsAfterPreviousEntry(List<ItineraryTimingEditSummary> entriesOfDay,
                                                         ItineraryTimingEditSummary editedEntry,
                                                         ItineraryTiming newTiming) {
        var position = entriesOfDay.indexOf(editedEntry);
        if (position == 0) {
            return;
        }
        var previousEntry = entriesOfDay.get(position - 1);
        if (newTiming.start().isBefore(previousEntry.entry().getTiming().end())) {
            throw conflictWith(previousEntry, ItineraryTimingIssue.ENTRY);
        }
    }

    private static void validateNewTiming(ItineraryTimingEditSummary entry, ItineraryTiming newTiming,
                                          List<ItineraryTimingEditSummary> entriesOfOtherDays) {
        validateKeepsStartDate(entry, newTiming);
        validateFitsTripDates(entry, newTiming);
        validateNoOverlapWithOtherDays(newTiming, entriesOfOtherDays);
    }

    private static void validateKeepsStartDate(ItineraryTimingEditSummary entry, ItineraryTiming newTiming) {
        var startDate = entry.entry().getTiming().date();
        if (!newTiming.date().equals(startDate)) {
            throw new BaseApiException("Propagation would change local start date", ITINERARY_START_DATE_CHANGE,
                    entry.name(), startDate);
        }
    }

    private static void validateFitsTripDates(ItineraryTimingEditSummary entry, ItineraryTiming newTiming) {
        if (!newTiming.fitsTripDates(entry.tripStart(), entry.tripEnd())) {
            throw new BaseApiException("Timing edit would extend past the trip", ITINERARY_END_OUTSIDE_TRIP,
                    ItineraryTimingIssue.ENTRY, entry.name(), entry.tripEnd());
        }
    }

    private static void validateNoOverlapWithOtherDays(ItineraryTiming newTiming,
                                                       List<ItineraryTimingEditSummary> entriesOfOtherDays) {
        entriesOfOtherDays.stream().filter(otherEntry -> newTiming.overlaps(otherEntry.entry().getTiming()))
                .findFirst()
                .ifPresent(otherEntry -> { throw conflictWith(otherEntry, ItineraryTimingIssue.ENTRY); });
    }

    private static Map<ItineraryEntry, ItineraryTiming> pushFollowingEntries(
            List<ItineraryTimingEditSummary> entriesOfDay, ItineraryTimingEditSummary editedEntry,
            ItineraryTiming newTiming, List<ItineraryTimingEditSummary> entriesOfOtherDays) {
        var followingEntries = entriesOfDay.subList(entriesOfDay.indexOf(editedEntry) + 1, entriesOfDay.size());
        var pushedTimings = new LinkedHashMap<ItineraryEntry, ItineraryTiming>();
        var previousEnd = newTiming.end();
        for (var followingEntry : followingEntries) {
            if (!followingEntry.entry().getTiming().start().isBefore(previousEnd)) {
                break; // The saved suffix still fits as-is.
            }
            var pushedTiming = push(followingEntry, previousEnd);
            validateNewTiming(followingEntry, pushedTiming, entriesOfOtherDays);
            pushedTimings.put(followingEntry.entry(), pushedTiming);
            previousEnd = pushedTiming.end();
        }
        return pushedTimings;
    }

    private static ItineraryTiming push(ItineraryTimingEditSummary entry, OffsetDateTime newStart) {
        if (entry.entry().isFixedStart()) {
            throw conflictWith(entry, ItineraryTimingIssue.FIXED_START);
        }
        return entry.entry().getTiming().withStartAt(newStart.toInstant());
    }

    private static BaseApiException conflictWith(ItineraryTimingEditSummary entry, ItineraryTimingIssue issue) {
        return new BaseApiException("Timeline timing conflict", ITINERARY_ENTRY_OVERLAP, issue, entry.name());
    }
}
