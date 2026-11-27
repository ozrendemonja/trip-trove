package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.ItineraryDependency;
import com.triptrove.manager.domain.model.ItineraryEntry;
import com.triptrove.manager.domain.model.ItineraryEntryRemoval;
import com.triptrove.manager.domain.model.ItineraryMoveStartChoices;
import com.triptrove.manager.domain.model.ItineraryRemoval;
import com.triptrove.manager.domain.model.ItineraryRemovalSummary;
import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.ItineraryTimingEditSummary;
import com.triptrove.manager.domain.model.ItineraryTimingIssue;
import com.triptrove.manager.domain.model.ItineraryTransfer;
import com.triptrove.manager.domain.model.ItineraryTransferRemovalSummary;
import com.triptrove.manager.domain.model.ItineraryTransferSummary;
import com.triptrove.manager.domain.model.SchedulingSummary;
import com.triptrove.manager.domain.model.VisitDuration;
import com.triptrove.manager.domain.repo.ItineraryEntryRepo;
import com.triptrove.manager.domain.repo.ItineraryEntryRemovalRepo;
import com.triptrove.manager.domain.repo.TripAttractionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ItineraryEntryEditor {
    private final ItineraryEntryRepo entries;
    private final ItineraryEntryRemovalRepo removals;
    private final TripAttractionRepo tripAttractions;

    public void joinAttraction(long tripId, long hostEntryId, long attractionId, Long sourceEntryId,
                               String visitDuration, List<ItineraryTransferSummary> transfersToRemoveWithSourceEntry) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var host = findEntry(itinerary, tripId, hostEntryId);
        var attraction = findAttractionToJoin(tripId, attractionId);
        var sourceEntry = findSourceEntry(itinerary, attractionId);

        validateNotAlreadyGrouped(attraction);
        validateSourceEntryCanJoin(sourceEntry, host);
        validateSourceEntryMatchesRequest(sourceEntry, sourceEntryId);
        attraction.requireEligible(sourceEntry != null);

        if (sourceEntry == null) {
            joinUnscheduledAttraction(tripId, itinerary, host, attractionId, attraction, visitDuration,
                    transfersToRemoveWithSourceEntry);
        } else {
            joinScheduledAttraction(tripId, itinerary, host, sourceEntry, visitDuration,
                    transfersToRemoveWithSourceEntry);
        }
    }

    private SchedulingSummary findAttractionToJoin(long tripId, long attractionId) {
        return tripAttractions.findSchedulingSummaryByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found in trip", RESOURCE_NOT_FOUND,
                        attractionId, tripId));
    }

    private static ItineraryTimingEditSummary findSourceEntry(List<ItineraryTimingEditSummary> itinerary,
                                                              long attractionId) {
        // An unscheduled attraction has no source entry.
        return itinerary.stream().filter(entry -> entry.entry().getAttractionId() == attractionId).findFirst()
                .orElse(null);
    }

    private static void validateNotAlreadyGrouped(SchedulingSummary attraction) {
        if (attraction.groupedUnderEntryId() != null) {
            throw new BaseApiException("Attraction is already grouped", ITINERARY_ATTRACTION_ALREADY_SCHEDULED);
        }
    }

    private static void validateSourceEntryCanJoin(ItineraryTimingEditSummary sourceEntry,
                                                   ItineraryTimingEditSummary host) {
        if (sourceEntry == host || (sourceEntry != null && sourceEntry.lastMemberPosition() > 0)) {
            throw new BaseApiException("A host cannot join itself or take its members into another group",
                    ITINERARY_GROUP_JOIN_NOT_ALLOWED);
        }
    }

    private static void validateSourceEntryMatchesRequest(ItineraryTimingEditSummary savedSourceEntry,
                                                          Long requestedSourceEntryId) {
        var savedSourceEntryId = savedSourceEntry == null ? null : savedSourceEntry.entry().getId();
        if (!Objects.equals(requestedSourceEntryId, savedSourceEntryId)) {
            throw new BaseApiException("The requested source entry does not match the saved one",
                    RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.GROUP_JOIN_CHANGED);
        }
    }

    private void joinUnscheduledAttraction(long tripId, List<ItineraryTimingEditSummary> itinerary,
                                           ItineraryTimingEditSummary host, long attractionId,
                                           SchedulingSummary attraction, String visitDuration,
                                           List<ItineraryTransferSummary> transfersToRemoveWithSourceEntry) {
        ItineraryTransferRemovalSummary.requireListed(List.of(), transfersToRemoveWithSourceEntry);
        var contribution = attraction.resolveVisitDurationMinutes(visitDuration);
        applyNewTiming(itinerary, host, hostTimingWithContribution(host, contribution));
        if (visitDuration != null) {
            tripAttractions.correctSchedulingDuration(attraction.tripAttractionId(), visitDuration);
        }
        addGroupedAttraction(tripId, attractionId, host, contribution, null);
    }

    private void joinScheduledAttraction(long tripId, List<ItineraryTimingEditSummary> itinerary,
                                         ItineraryTimingEditSummary host, ItineraryTimingEditSummary sourceEntry,
                                         String visitDuration,
                                         List<ItineraryTransferSummary> transfersToRemoveWithSourceEntry) {
        if (visitDuration != null) {
            throw new IllegalArgumentException("A grouped attraction keeps its source entry's planned length");
        }
        var transfersOfSourceEntry = transfersOfSourceEntry(itinerary, sourceEntry);
        ItineraryTransferRemovalSummary.requireListed(transfersOfSourceEntry, transfersToRemoveWithSourceEntry);
        var contribution = sourceEntry.entry().getTiming().plannedMinutes();
        // The source entry leaves the itinerary, so its saved interval must not block the longer host.
        var itineraryWithoutSourceEntry = itinerary.stream().filter(entry -> entry != sourceEntry).toList();
        applyNewTiming(itineraryWithoutSourceEntry, host, hostTimingWithContribution(host, contribution));
        clearTransfers(itineraryWithoutSourceEntry, transfersOfSourceEntry);
        // Delete the source entry only after the grouped attraction copies its check state and watched-source baseline.
        addGroupedAttraction(tripId, sourceEntry.entry().getAttractionId(), host, contribution,
                sourceEntry.entry().getId());
        entries.delete(sourceEntry.entry());
    }

    private static List<ItineraryTransferRemovalSummary> transfersOfSourceEntry(
            List<ItineraryTimingEditSummary> itinerary, ItineraryTimingEditSummary sourceEntry) {
        var date = sourceEntry.entry().getTiming().date();
        var dayWithoutSourceEntry = entriesOn(itinerary, date).stream().filter(entry -> entry != sourceEntry).toList();
        return disconnectedTransfers(itinerary, Map.of(date, dayWithoutSourceEntry));
    }

    private static ItineraryTiming hostTimingWithContribution(ItineraryTimingEditSummary host, int contribution) {
        var timing = host.entry().getTiming();
        var plannedMinutes = (long) timing.plannedMinutes() + contribution;
        if (plannedMinutes > Integer.MAX_VALUE) {
            throw new BaseApiException("Grouped length exceeds the supported elapsed minutes",
                    ITINERARY_END_OUTSIDE_TRIP, ItineraryTimingIssue.ENTRY, host.name(), host.tripEnd());
        }
        return timing.withPlannedMinutes((int) plannedMinutes);
    }

    private void addGroupedAttraction(long tripId, long attractionId, ItineraryTimingEditSummary host,
                                      int contribution, Long sourceEntryId) {
        var hostEntryId = host.entry().getId();
        var position = host.lastMemberPosition() + 1;
        var added = entries.addGroupedAttraction(tripId, attractionId, hostEntryId, position, contribution,
                sourceEntryId);
        if (added != 1) {
            throw new IllegalStateException("Could not join attraction " + attractionId + " to entry " + hostEntryId);
        }
    }

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

    public void updateTransfer(long tripId, long fromEntryId, ItineraryTransfer transfer) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var from = findEntry(itinerary, tripId, fromEntryId);
        var timing = from.entry().getTiming();
        var day = entriesOn(itinerary, timing.date());
        requireNextEntry(day, from, transfer.toEntryId());
        var pushed = pushFollowingEntries(day, from, timing, entriesNotOn(itinerary, timing.date()),
                ItineraryTimingIssue.ENTRY, transfer);
        from.entry().changeOutgoingTransfer(transfer);
        pushed.forEach(ItineraryEntry::changeTiming);
    }

    public void removeTransfer(long tripId, long fromEntryId, long toEntryId) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var from = findEntry(itinerary, tripId, fromEntryId);
        requireNextEntry(entriesOn(itinerary, from.entry().getTiming().date()), from, toEntryId);
        from.entry().changeOutgoingTransfer(null);
    }

    private static void requireNextEntry(List<ItineraryTimingEditSummary> day, ItineraryTimingEditSummary from,
                                         long toEntryId) {
        var next = day.indexOf(from) + 1;
        if (next == day.size() || day.get(next).entry().getId() != toEntryId) {
            throw new BaseApiException("Transfer endpoints are not consecutive on the same itinerary day",
                    RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.TRANSFER_NEIGHBOURS_CHANGED,
                    from.entry().getId(), toEntryId);
        }
    }

    public void moveEntry(long tripId, long entryId, LocalDate date, Long beforeEntryId, String startOffset,
                          List<ItineraryTransferSummary> transfersToRemove) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var entryForMove = findEntry(itinerary, tripId, entryId);
        validateDayInTrip(entryForMove, date);
        var entriesOfDay = entriesOn(itinerary, date);
        var proposedDayOrder = proposeDayOrderForMove(entriesOfDay, entryForMove, beforeEntryId, tripId);
        if (proposedDayOrder.equals(entriesOfDay)) {
            ItineraryTransferRemovalSummary.requireListed(List.of(), transfersToRemove);
            return; // The same position keeps the interval, including free time before and after it.
        }
        applyMove(itinerary, proposedDayOrder, entryForMove, date, startOffset, transfersToRemove);
    }

    public void removeEntry(long tripId, long entryId, List<ItineraryTransferSummary> transfersToRemove) {
        var entryForRemoval = entries.findRemovalSummaryByTripIdAndEntryId(tripId, entryId)
                .orElseThrow(() -> entryNotFound(tripId, entryId));
        remove(tripId, entryForRemoval, ItineraryEntryRemoval.Cause.ITINERARY, transfersToRemove);
    }

    public void unscheduleAttraction(long tripId, long attractionId, ItineraryRemoval itineraryRemoval,
                                     ItineraryEntryRemoval.Cause cause) {
        var entryForRemoval = entries.findRemovalSummaryByTripIdAndEntryId(tripId, itineraryRemoval.entryId())
                .filter(current -> current.entry().getAttractionId() == attractionId)
                .orElseThrow(() -> new BaseApiException("The board's itinerary removal no longer matches the itinerary",
                        RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.BOARD_REMOVAL_CHANGED, tripId, attractionId));
        remove(tripId, entryForRemoval, cause, itineraryRemoval.transfersToRemove());
    }

    private void remove(long tripId, ItineraryRemovalSummary entryForRemoval, ItineraryEntryRemoval.Cause cause,
                        List<ItineraryTransferSummary> transfersToRemove) {
        if (entryForRemoval.hasGroupedAttractions()) {
            throw new BaseApiException("The entry hosts grouped attractions",
                    RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.GROUP_REMOVAL_UNAVAILABLE);
        }
        ItineraryTransferRemovalSummary.requireListed(entryForRemoval.transferRemovals(), transfersToRemove);
        if (entryForRemoval.incomingTransferFromEntry() != null) {
            entryForRemoval.incomingTransferFromEntry().changeOutgoingTransfer(null);
        }
        if (entryForRemoval.lastCheckedAt() != null) {
            removals.save(new ItineraryEntryRemoval(tripId, entryForRemoval.entry().getTiming().date(),
                    entryForRemoval.subject(), entryForRemoval.entry().isFollowingStartsPushedSinceCheck(), cause));
        }
        entries.delete(entryForRemoval.entry());
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
                                  ItineraryTimingEditSummary entryForMove, LocalDate date, String startOffset,
                                  List<ItineraryTransferSummary> transfersToRemove) {
        // The moved entry leaves its old day, so its saved interval there must not block the move.
        var entriesOfOtherDays = entriesNotOn(itinerary, date).stream()
                .filter(entry -> !entry.equals(entryForMove)).toList();

        var newTiming = chooseStartOccurrence(proposedDayOrder, entryForMove, date, entriesOfOtherDays,
                startOffset);
        var pushedTimings = validateMoveAndPushFollowingEntries(proposedDayOrder, entryForMove, newTiming, date,
                entriesOfOtherDays);
        disconnectTransfersForMove(itinerary, proposedDayOrder, entryForMove, date, transfersToRemove);

        // Change timings and positions only after every check passes, so a rejected move changes nothing.
        entryForMove.entry().moveTo(newTiming, !pushedTimings.isEmpty());
        pushedTimings.forEach(ItineraryEntry::retimeForMove);
        renumberPathPositions(proposedDayOrder);
    }

    private static void disconnectTransfersForMove(List<ItineraryTimingEditSummary> itinerary,
            List<ItineraryTimingEditSummary> proposedDayOrder, ItineraryTimingEditSummary moved, LocalDate date,
            List<ItineraryTransferSummary> transfersToRemove) {
        var sourceDate = moved.entry().getTiming().date();
        var changedDays = new HashMap<LocalDate, List<ItineraryTimingEditSummary>>();
        changedDays.put(date, proposedDayOrder);
        if (!date.equals(sourceDate)) {
            changedDays.put(sourceDate, entriesOn(itinerary, sourceDate).stream()
                    .filter(entry -> !entry.equals(moved)).toList());
        }
        var disconnected = disconnectedTransfers(itinerary, changedDays);
        ItineraryTransferRemovalSummary.requireListed(disconnected, transfersToRemove);
        clearTransfers(itinerary, disconnected);
    }

    private static List<ItineraryTransferRemovalSummary> disconnectedTransfers(List<ItineraryTimingEditSummary> itinerary,
            Map<LocalDate, List<ItineraryTimingEditSummary>> changedDays) {
        var neighbours = new HashMap<Long, Long>();
        changedDays.values().forEach(path -> connectNeighbours(neighbours, path));
        var byId = itinerary.stream().collect(Collectors.toMap(entry -> entry.entry().getId(), Function.identity()));
        var disconnected = new ArrayList<ItineraryTransferRemovalSummary>();
        for (var from : itinerary) {
            var fromDate = from.entry().getTiming().date();
            var transfer = from.entry().getOutgoingTransfer();
            if (transfer != null && changedDays.containsKey(fromDate)
                    && !Objects.equals(neighbours.get(from.entry().getId()), transfer.toEntryId())) {
                disconnected.add(new ItineraryTransferRemovalSummary(from.entry().getId(), from.name(),
                        byId.get(transfer.toEntryId()).name(), transfer));
            }
        }
        return disconnected;
    }

    private static void clearTransfers(List<ItineraryTimingEditSummary> remaining,
            List<ItineraryTransferRemovalSummary> disconnected) {
        var departureIds = disconnected.stream().map(removal -> removal.transfer().fromEntryId())
                .collect(Collectors.toSet());
        remaining.stream().map(ItineraryTimingEditSummary::entry)
                .filter(entry -> departureIds.contains(entry.getId()))
                .forEach(entry -> entry.changeOutgoingTransfer(null));
    }

    private static void connectNeighbours(Map<Long, Long> neighbours, List<ItineraryTimingEditSummary> path) {
        for (int i = 1; i < path.size(); i++) {
            neighbours.put(path.get(i - 1).entry().getId(), path.get(i).entry().getId());
        }
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
            var next = entriesOfDay.get(1);
            var transfer = transferBetween(entryForMove, next);
            var minutes = (long) savedTiming.plannedMinutes() + (transfer == null ? 0 : transfer.minutes());
            return List.of(savedTiming.withStartAt(
                    next.entry().getTiming().start().minusMinutes(minutes).toInstant(), zone));
        }
        var previous = entriesOfDay.get(position - 1);
        var arrival = arrivalAfter(previous.entry().getTiming().end(), transferBetween(previous, entryForMove));
        return List.of(savedTiming.withStartAt(arrival.toInstant(), zone));
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
        var hostMinutes = plannedMinutes - entry.contributionMinutes();
        if (hostMinutes < visitDuration.minimumMinutes() || hostMinutes > visitDuration.maximumMinutes()) {
            if (entry.lastMemberPosition() > 0) {
                throw new BaseApiException("Replacement total outside host range plus contributions",
                        ITINERARY_PLANNED_LENGTH_NOT_ALLOWED, ItineraryTimingIssue.GROUP_TOTAL, entry.name(),
                        visitDuration.minimumMinutes() + entry.contributionMinutes(),
                        visitDuration.maximumMinutes() + entry.contributionMinutes());
            }
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
        var transfer = transferBetween(previousEntry, editedEntry);
        var arrival = arrivalAfter(previousEntry.entry().getTiming().end(), transfer);
        if (newTiming.start().isBefore(arrival)) {
            if (transfer != null && transfer.minutes() > 0) {
                throw conflictWithTransfer(previousEntry, editedEntry, transfer);
            }
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
        return pushFollowingEntries(entriesOfDay, editedEntry, newTiming, entriesOfOtherDays, conflict,
                editedEntry.entry().getOutgoingTransfer());
    }

    private static Map<ItineraryEntry, ItineraryTiming> pushFollowingEntries(
            List<ItineraryTimingEditSummary> entriesOfDay, ItineraryTimingEditSummary editedEntry,
            ItineraryTiming newTiming, List<ItineraryTimingEditSummary> entriesOfOtherDays, ItineraryTimingIssue conflict,
            ItineraryTransfer outgoingTransfer) {
        var followingEntries = entriesOfDay.subList(entriesOfDay.indexOf(editedEntry) + 1, entriesOfDay.size());
        var pushedTimings = new LinkedHashMap<ItineraryEntry, ItineraryTiming>();
        var previousEntry = editedEntry;
        var previousEnd = newTiming.end();
        for (var followingEntry : followingEntries) {
            var transfer = ItineraryTransfer.between(outgoingTransfer, followingEntry.entry().getId());
            var arrival = arrivalAfter(previousEnd, transfer);
            if (!followingEntry.entry().getTiming().start().isBefore(arrival)) {
                break; // The saved suffix still fits as-is.
            }
            if (followingEntry.entry().isFixedStart() && transfer != null && transfer.minutes() > 0) {
                throw conflictWithTransfer(previousEntry, followingEntry, transfer);
            }
            var pushedTiming = push(followingEntry, arrival, conflict);
            validateNewTiming(followingEntry, pushedTiming, newTiming.date(), entriesOfOtherDays, conflict);
            pushedTimings.put(followingEntry.entry(), pushedTiming);
            previousEntry = followingEntry;
            previousEnd = pushedTiming.end();
            outgoingTransfer = followingEntry.entry().getOutgoingTransfer();
        }
        return pushedTimings;
    }

    private static ItineraryTransfer transferBetween(ItineraryTimingEditSummary from, ItineraryTimingEditSummary to) {
        return ItineraryTransfer.between(from.entry().getOutgoingTransfer(), to.entry().getId());
    }

    private static OffsetDateTime arrivalAfter(OffsetDateTime end, ItineraryTransfer transfer) {
        return transfer == null ? end : end.plusMinutes(transfer.minutes());
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

    private static BaseApiException conflictWithTransfer(ItineraryTimingEditSummary from, ItineraryTimingEditSummary to,
                                                          ItineraryTransfer transfer) {
        return new BaseApiException("Transfer does not fit between entries", ITINERARY_ENTRY_OVERLAP,
                ItineraryTimingIssue.TRANSFER, transfer.minutes(), from.name(), to.name());
    }
}
