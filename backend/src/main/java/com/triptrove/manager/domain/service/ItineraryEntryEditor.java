package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.ItineraryEntry;
import com.triptrove.manager.domain.model.ItineraryEntryRemoval;
import com.triptrove.manager.domain.model.ItineraryMoveStartChoices;
import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.ItineraryTimingEditSummary;
import com.triptrove.manager.domain.model.ItineraryTimingIssue;
import com.triptrove.manager.domain.model.VisitDuration;
import com.triptrove.manager.domain.repo.ItineraryEntryRepo;
import com.triptrove.manager.domain.repo.ItineraryEntryRemovalRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ItineraryEntryEditor {
    private final ItineraryEntryRepo entries;
    private final ItineraryEntryRemovalRepo removals;

    public void updateItineraryEntryFixedStart(long tripId, long entryId, boolean fixed) {
        entries.findByIdAndTripId(entryId, tripId)
                .orElseThrow(() -> entryNotFound(tripId, entryId))
                .changeFixedStart(fixed);
    }

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

    public void moveEntry(long tripId, long entryId, LocalDate date, Long beforeEntryId, String startOffset) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var entryForMove = findEntry(itinerary, tripId, entryId);
        validateDayInTrip(entryForMove, date);
        var entriesOfDay = entriesOn(itinerary, date);
        var proposedDayOrder = proposeDayOrderForMove(entriesOfDay, entryForMove, beforeEntryId, tripId);
        if (proposedDayOrder.equals(entriesOfDay)) {
            return; // The same position keeps the interval, including free time before and after it.
        }
        applyMove(itinerary, proposedDayOrder, entryForMove, date, startOffset);
    }

    public void removeEntry(long tripId, long entryId) {
        var removed = entries.findRemovalSummaryByTripIdAndEntryId(tripId, entryId)
                .orElseThrow(() -> entryNotFound(tripId, entryId));
        if (removed.lastCheckedAt() != null) {
            removals.save(new ItineraryEntryRemoval(tripId, removed.entry().getTiming().date(), removed.subject(),
                    removed.entry().isFollowingStartsPushedSinceCheck()));
        }
        entries.delete(removed.entry());
    }

    private static void validateDayInTrip(ItineraryTimingEditSummary entry, LocalDate date) {
        if (date.isBefore(entry.tripStart()) || date.isAfter(entry.tripEnd())) {
            throw new BaseApiException("No itinerary day for the destination", ITINERARY_DAY_NOT_IN_TRIP, date);
        }
    }

    private static List<ItineraryTimingEditSummary> proposeDayOrderForMove(
            List<ItineraryTimingEditSummary> entriesOfDay, ItineraryTimingEditSummary entryForMove, Long beforeEntryId,
            long tripId) {
        var proposedDayOrder = new ArrayList<>(entriesOfDay);
        proposedDayOrder.remove(entryForMove);
        var newPosition = beforeEntryId == null
                ? proposedDayOrder.size()
                : proposedDayOrder.indexOf(findEntry(proposedDayOrder, tripId, beforeEntryId));
        proposedDayOrder.add(newPosition, entryForMove);
        return proposedDayOrder;
    }

    private static void applyMove(List<ItineraryTimingEditSummary> itinerary,
                                  List<ItineraryTimingEditSummary> proposedDayOrder,
                                  ItineraryTimingEditSummary entryForMove, LocalDate date, String startOffset) {
        // The moved entry leaves its old day, so its saved interval there must not block the move.
        var entriesOfOtherDays = entriesNotOn(itinerary, date).stream()
                .filter(entry -> !entry.equals(entryForMove)).toList();

        var newTiming = chooseStartOccurrence(proposedDayOrder, entryForMove, date, entriesOfOtherDays,
                startOffset);
        var pushedTimings = validateMoveAndPushFollowingEntries(proposedDayOrder, entryForMove, newTiming, date,
                entriesOfOtherDays);

        // Change timings and positions only after every check passes, so a rejected move changes nothing.
        entryForMove.entry().moveTo(newTiming, !pushedTimings.isEmpty());
        pushedTimings.forEach(ItineraryEntry::retimeForMove);
        renumberPathPositions(proposedDayOrder);
    }

    private static ItineraryTiming chooseStartOccurrence(List<ItineraryTimingEditSummary> entriesOfDay,
            ItineraryTimingEditSummary entryForMove, LocalDate date, List<ItineraryTimingEditSummary> entriesOfOtherDays,
            String startOffset) {
        var startOccurrences = startOccurrencesAtNewPosition(entriesOfDay, entryForMove, date);
        if (startOffset != null) {
            return startOccurrences.stream().filter(occurrence -> occurrence.hasStartOffset(startOffset)).findFirst()
                    .orElseThrow(() -> new BaseApiException("Requested offset does not resolve the proposed move",
                            ITINERARY_START_OFFSET_NOT_AVAILABLE, startOffset));
        }
        if (startOccurrences.size() == 1) {
            return startOccurrences.getFirst();
        }
        // The local clock repeats: use the only occurrence that fits, or ask which one to use.
        var fittingOccurrences = startOccurrences.stream()
                .filter(occurrence -> fitsItinerary(entriesOfDay, entryForMove, occurrence, date, entriesOfOtherDays))
                .toList();
        return switch (fittingOccurrences.size()) {
            case 0 -> startOccurrences.getFirst(); // Neither fits: validating the first one reports its conflict.
            case 1 -> fittingOccurrences.getFirst();
            default -> throw new BaseApiException("More than one start occurrence fits the proposed move",
                    ITINERARY_MOVE_START_CHOICE_REQUIRED, new ItineraryMoveStartChoices(fittingOccurrences.stream()
                            .map(occurrence -> occurrence.start().getOffset().getId()).toList()));
        };
    }

    private static List<ItineraryTiming> startOccurrencesAtNewPosition(List<ItineraryTimingEditSummary> entriesOfDay,
            ItineraryTimingEditSummary entryForMove, LocalDate date) {
        var savedTiming = entryForMove.entry().getTiming();
        // Until there are zone-changing journeys, all positions inherit the itinerary's initial zone.
        var zone = ZoneId.of(entryForMove.itineraryZone());
        var onlyEntryOfDay = entriesOfDay.size() == 1;
        if (entryForMove.entry().isFixedStart() || onlyEntryOfDay) {
            // Keep the saved local clock; on a new date where it repeats, both of its occurrences are candidates.
            return savedTiming.localStartsOn(date, zone);
        }
        var position = entriesOfDay.indexOf(entryForMove);
        if (position == 0) {
            var nextEntryStart = entriesOfDay.get(1).entry().getTiming().start();
            return List.of(savedTiming.withStartAt(
                    nextEntryStart.minusMinutes(savedTiming.plannedMinutes()).toInstant(), zone));
        }
        var previousEntryEnd = entriesOfDay.get(position - 1).entry().getTiming().end();
        return List.of(savedTiming.withStartAt(previousEntryEnd.toInstant(), zone));
    }

    private static boolean fitsItinerary(List<ItineraryTimingEditSummary> entriesOfDay,
                                         ItineraryTimingEditSummary entryForMove, ItineraryTiming newTiming,
                                         LocalDate date, List<ItineraryTimingEditSummary> entriesOfOtherDays) {
        try {
            validateMoveAndPushFollowingEntries(entriesOfDay, entryForMove, newTiming, date, entriesOfOtherDays);
            return true;
        } catch (BaseApiException conflict) {
            return false;
        }
    }

    private static Map<ItineraryEntry, ItineraryTiming> validateMoveAndPushFollowingEntries(
            List<ItineraryTimingEditSummary> entriesOfDay, ItineraryTimingEditSummary entryForMove,
            ItineraryTiming newTiming, LocalDate date, List<ItineraryTimingEditSummary> entriesOfOtherDays) {
        validateStartsAfterPreviousEntry(entriesOfDay, entryForMove, newTiming, ItineraryTimingIssue.MOVE_ENTRY);
        validateNewTiming(entryForMove, newTiming, date, entriesOfOtherDays, ItineraryTimingIssue.MOVE_ENTRY);
        return pushFollowingEntries(entriesOfDay, entryForMove, newTiming, entriesOfOtherDays,
                ItineraryTimingIssue.MOVE_ENTRY);
    }

    private static void renumberPathPositions(List<ItineraryTimingEditSummary> entriesOfDay) {
        for (int i = 0; i < entriesOfDay.size(); i++) {
            entriesOfDay.get(i).entry().setPathPosition(i + 1);
        }
    }

    private static ItineraryTimingEditSummary findEntry(List<ItineraryTimingEditSummary> itinerary, long tripId,
                                                        long entryId) {
        return itinerary.stream().filter(entry -> entry.entry().getId() == entryId).findFirst()
                .orElseThrow(() -> entryNotFound(tripId, entryId));
    }

    private static BaseApiException entryNotFound(long tripId, long entryId) {
        return new BaseApiException("Entry not found in trip", RESOURCE_NOT_FOUND, entryId, tripId);
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

        validateStartsAfterPreviousEntry(entriesOfDay, editedEntry, newTiming, ItineraryTimingIssue.ENTRY);
        validateNewTiming(editedEntry, newTiming, date, entriesOfOtherDays, ItineraryTimingIssue.ENTRY);
        var pushedTimings = pushFollowingEntries(entriesOfDay, editedEntry, newTiming, entriesOfOtherDays,
                ItineraryTimingIssue.ENTRY);

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
                                                         ItineraryTiming newTiming, ItineraryTimingIssue conflict) {
        var position = entriesOfDay.indexOf(editedEntry);
        if (position == 0) {
            return;
        }
        var previousEntry = entriesOfDay.get(position - 1);
        if (newTiming.start().isBefore(previousEntry.entry().getTiming().end())) {
            var issue = conflict == ItineraryTimingIssue.MOVE_ENTRY && previousEntry.entry().isFixedStart()
                    ? ItineraryTimingIssue.MOVE_FIXED_START : conflict;
            throw conflictWith(previousEntry, issue);
        }
    }

    private static void validateNewTiming(ItineraryTimingEditSummary entry, ItineraryTiming newTiming, LocalDate date,
                                          List<ItineraryTimingEditSummary> entriesOfOtherDays, ItineraryTimingIssue conflict) {
        validateKeepsStartDate(entry, newTiming, date, conflict);
        validateFitsTripDates(entry, newTiming);
        validateNoOverlapWithOtherDays(newTiming, entriesOfOtherDays, conflict);
    }

    private static void validateKeepsStartDate(ItineraryTimingEditSummary entry, ItineraryTiming newTiming,
                                               LocalDate startDate, ItineraryTimingIssue conflict) {
        if (!newTiming.date().equals(startDate)) {
            if (conflict == ItineraryTimingIssue.MOVE_ENTRY) {
                throw new BaseApiException("Move would change local start date", ITINERARY_START_DATE_CHANGE,
                        conflict, entry.name(), startDate);
            }
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
                                                       List<ItineraryTimingEditSummary> entriesOfOtherDays,
                                                       ItineraryTimingIssue conflict) {
        entriesOfOtherDays.stream().filter(otherEntry -> newTiming.overlaps(otherEntry.entry().getTiming()))
                .findFirst()
                .ifPresent(otherEntry -> { throw conflictWith(otherEntry, conflict); });
    }

    private static Map<ItineraryEntry, ItineraryTiming> pushFollowingEntries(
            List<ItineraryTimingEditSummary> entriesOfDay, ItineraryTimingEditSummary editedEntry,
            ItineraryTiming newTiming, List<ItineraryTimingEditSummary> entriesOfOtherDays, ItineraryTimingIssue conflict) {
        var followingEntries = entriesOfDay.subList(entriesOfDay.indexOf(editedEntry) + 1, entriesOfDay.size());
        var pushedTimings = new LinkedHashMap<ItineraryEntry, ItineraryTiming>();
        var previousEnd = newTiming.end();
        for (var followingEntry : followingEntries) {
            if (!followingEntry.entry().getTiming().start().isBefore(previousEnd)) {
                break; // The saved suffix still fits as-is.
            }
            var pushedTiming = push(followingEntry, previousEnd, conflict);
            validateNewTiming(followingEntry, pushedTiming, newTiming.date(), entriesOfOtherDays, conflict);
            pushedTimings.put(followingEntry.entry(), pushedTiming);
            previousEnd = pushedTiming.end();
        }
        return pushedTimings;
    }

    private static ItineraryTiming push(ItineraryTimingEditSummary entry, OffsetDateTime newStart,
                                        ItineraryTimingIssue conflict) {
        if (entry.entry().isFixedStart()) {
            throw conflictWith(entry, conflict == ItineraryTimingIssue.MOVE_ENTRY
                    ? ItineraryTimingIssue.MOVE_FIXED_START : ItineraryTimingIssue.FIXED_START);
        }
        return entry.entry().getTiming().withStartAt(newStart.toInstant());
    }

    private static BaseApiException conflictWith(ItineraryTimingEditSummary entry, ItineraryTimingIssue issue) {
        return new BaseApiException("Timeline timing conflict", ITINERARY_ENTRY_OVERLAP, issue, entry.name());
    }
}
