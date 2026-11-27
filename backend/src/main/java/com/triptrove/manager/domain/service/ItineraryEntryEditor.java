package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.AttractionToSchedule.MissingInputs;
import com.triptrove.manager.domain.model.AttractionToSchedule.RequiredInput;
import com.triptrove.manager.domain.model.ItineraryDependency;
import com.triptrove.manager.domain.model.ItineraryEntry;
import com.triptrove.manager.domain.model.ItineraryEntryRemoval;
import com.triptrove.manager.domain.model.ItineraryGroupedAttraction;
import com.triptrove.manager.domain.model.ItineraryGroupedAttractionEditSummary;
import com.triptrove.manager.domain.model.ItineraryItemFit;
import com.triptrove.manager.domain.model.ItineraryItemKind;
import com.triptrove.manager.domain.model.ItineraryItemToAdd;
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
import com.triptrove.manager.domain.repo.ItineraryGroupedAttractionRepo;
import com.triptrove.manager.domain.repo.ItineraryRepo;
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
import java.util.Set;
import java.util.function.Function;
import java.util.function.IntFunction;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ItineraryEntryEditor {
    private final ItineraryEntryRepo entries;
    private final ItineraryRepo itineraries;
    private final ItineraryEntryRemovalRepo removals;
    private final ItineraryGroupedAttractionRepo groupedAttractions;
    private final TripAttractionRepo tripAttractions;

    public void addItem(long tripId, ItineraryItemToAdd request) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var tripTiming = tripTimingForInsertion(tripId, itinerary);
        var date = request.date();
        validateDayInTrip(date, tripTiming.tripStart(), tripTiming.tripEnd());

        var proposedDay = new ArrayList<>(entriesOn(itinerary, date));
        var insertionIndex = itemInsertionIndex(proposedDay, tripId, request);
        var item = proposeInsertedItem(tripId, request, tripTiming, proposedDay, insertionIndex);
        proposedDay.add(insertionIndex, item);
        var pushedTimings = planInsertedItemTiming(proposedDay, item, date, entriesNotOn(itinerary, date));
        var disconnected = confirmedTransferRemovals(itinerary, Map.of(date, proposedDay),
                request.transfersToRemoveAtInsertionPoint());

        if (tripTiming.timeZone() == null) {
            itineraries.getReferenceById(tripId).initializeTimeZone(item.itineraryZone());
        }
        clearTransfers(itinerary, disconnected);
        pushedTimings.forEach(ItineraryEntry::changeTiming);
        renumberPathPositions(proposedDay);
        entries.save(item.entry());
    }

    private ItineraryTripTiming tripTimingForInsertion(long tripId, List<ItineraryTimingEditSummary> itinerary) {
        if (!itinerary.isEmpty()) {
            var first = itinerary.getFirst();
            return new ItineraryTripTiming(first.tripStart(), first.tripEnd(), first.itineraryZone());
        }
        var trip = itineraries.findSummaryByTripId(tripId)
                .orElseThrow(() -> new BaseApiException("Itinerary not found for trip", RESOURCE_NOT_FOUND, tripId));
        return new ItineraryTripTiming(trip.tripStart(), trip.tripEnd(), trip.timeZone());
    }

    private static ItineraryTimingEditSummary proposeInsertedItem(long tripId, ItineraryItemToAdd request,
            ItineraryTripTiming tripTiming, List<ItineraryTimingEditSummary> day, int insertionIndex) {
        var savedZone = tripTiming.timeZone();
        var zoneName = savedZone == null && request.timeZone() != null ? request.timeZone().strip() : savedZone;
        requireItemTimingInputs(request.start(), day.isEmpty(), zoneName);
        var zone = ItineraryTiming.requireNamedZone(zoneName);
        var timing = day.isEmpty()
                ? new ItineraryTiming(request.date(), request.start(), zone, request.plannedMinutes())
                : ItineraryTiming.atInstant(day.get(insertionIndex - 1).timing().end().toInstant(), zone, request.plannedMinutes());
        var item = ItineraryEntry.forTypedItem(tripId, request.item(), insertionIndex + 1, timing, request.fixedStart());
        return new ItineraryTimingEditSummary(item, request.item().name(), null,
                tripTiming.tripStart(), tripTiming.tripEnd(), zoneName, 0, 0);
    }

    private static int itemInsertionIndex(List<ItineraryTimingEditSummary> day, long tripId, ItineraryItemToAdd request) {
        if (day.isEmpty() && request.afterEntryId() == null) {
            return 0;
        }
        if (request.afterEntryId() == null || request.start() != null) {
            throw new BaseApiException("The selected day now determines the new item's start",
                    RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.ITEM_POSITION_CHANGED);
        }
        return day.indexOf(findEntry(day, tripId, request.afterEntryId())) + 1;
    }

    private static void requireItemTimingInputs(LocalTime start, boolean emptyDay, String zoneName) {
        var missing = new ArrayList<RequiredInput>();
        if (emptyDay && start == null) {
            missing.add(RequiredInput.START);
        }
        if (zoneName == null || zoneName.isBlank()) {
            missing.add(RequiredInput.TIME_ZONE);
        }
        if (!missing.isEmpty()) {
            throw new BaseApiException(ITINERARY_INPUT_REQUIRED, ItineraryTimingIssue.TYPED_ITEM, new MissingInputs(missing));
        }
    }

    private static Map<ItineraryEntry, ItineraryTiming> planInsertedItemTiming(
            List<ItineraryTimingEditSummary> proposedDay, ItineraryTimingEditSummary item,
            LocalDate date, List<ItineraryTimingEditSummary> otherDays) {
        var timing = item.timing();
        return planItemTiming(item.entry().getTypedItem().kind(), timing.plannedMinutes(), minutes ->
                validateAndPushFollowingEntries(proposedDay, item, timing.withPlannedMinutes(minutes), date, otherDays,
                        ItineraryTimingIssue.ENTRY));
    }

    private static Map<ItineraryEntry, ItineraryTiming> planItemTiming(ItineraryItemKind kind, int requestedMinutes,
            IntFunction<Map<ItineraryEntry, ItineraryTiming>> plan) {
        try {
            return plan.apply(requestedMinutes);
        } catch (BaseApiException conflict) {
            if (kind != ItineraryItemKind.MEAL || !isTimingFitConflict(conflict)) {
                throw conflict;
            }
            var maximum = maximumFittingMealMinutes(requestedMinutes, plan);
            var context = Stream.concat(conflict.getContext().stream(), Stream.of(new ItineraryItemFit(maximum))).toArray();
            throw new BaseApiException("The requested meal does not fit", conflict.getErrorCode(), context);
        }
    }

    private static int maximumFittingMealMinutes(int tooLong, IntFunction<Map<ItineraryEntry, ItineraryTiming>> plan) {
        // The start is unchanged and longer lengths can only push following entries later.
        int fits = 0;
        while (tooLong - fits > 1) {
            int candidate = fits + (tooLong - fits) / 2;
            try {
                plan.apply(candidate);
                fits = candidate;
            } catch (BaseApiException conflict) {
                if (!isTimingFitConflict(conflict)) {
                    throw conflict;
                }
                tooLong = candidate;
            }
        }
        return fits;
    }

    private static boolean isTimingFitConflict(BaseApiException conflict) {
        return switch (conflict.getErrorCode()) {
            case ITINERARY_ENTRY_OVERLAP, ITINERARY_START_DATE_CHANGE, ITINERARY_END_OUTSIDE_TRIP -> true;
            default -> false;
        };
    }

    public void updateItem(long tripId, long entryId, String name, int minutes, boolean fixedStart, String note) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var updated = findEntry(itinerary, tripId, entryId);
        var entry = updated.entry();
        var item = entry.getTypedItem();
        if (item == null) {
            throw new BaseApiException("Timed item not found in trip", RESOURCE_NOT_FOUND, entryId, tripId);
        }
        var savedTiming = entry.getTiming();
        if (savedTiming.plannedMinutes() != minutes) {
            validatePlannedLengthChange(updated, minutes);
            var pushedTimings = planItemTiming(item.kind(), minutes,
                    candidate -> planTimingChange(itinerary, updated, savedTiming.withPlannedMinutes(candidate)));
            entry.changeTiming(savedTiming.withPlannedMinutes(minutes));
            pushedTimings.forEach(ItineraryEntry::changeTiming);
        }
        entry.changeItemDetails(name, note);
        entry.changeFixedStart(fixedStart);
    }

    public void reorderGroupedAttractions(long tripId, long hostEntryId, List<Long> attractionIds) {
        var host = entries.findByIdAndTripId(hostEntryId, tripId)
                .orElseThrow(() -> entryNotFound(tripId, hostEntryId));
        requireAttractionEntry(host);
        var members = groupedAttractions.findAllByTripIdAndHostEntryIdOrderByPosition(tripId, hostEntryId);
        var savedOrder = members.stream().map(ItineraryGroupedAttraction::getAttractionId).toList();
        if (attractionIds.equals(savedOrder)) {
            return;
        }
        requireSameMembers(savedOrder, attractionIds);
        var byAttractionId = members.stream()
                .collect(Collectors.toMap(ItineraryGroupedAttraction::getAttractionId, Function.identity()));
        for (int i = 0; i < attractionIds.size(); i++) {
            byAttractionId.get(attractionIds.get(i)).setPosition(i + 1);
        }
        host.markGroupChanged();
    }

    private static void requireSameMembers(List<Long> saved, List<Long> requested) {
        if (saved.size() != requested.size() || !Set.copyOf(saved).equals(Set.copyOf(requested))) {
            throw groupEditChanged("The requested members do not match the saved group");
        }
    }

    private static BaseApiException groupEditChanged(String diagnostic) {
        return new BaseApiException(diagnostic, RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.GROUP_EDIT_CHANGED);
    }

    public void moveGroupedAttraction(long tripId, long hostEntryId, long attractionId, long destinationEntryId) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var sourceHost = findEntry(itinerary, tripId, hostEntryId);
        var destination = findEntry(itinerary, tripId, destinationEntryId);
        requireAttractionEntry(sourceHost.entry());
        requireAttractionEntry(destination.entry());
        if (sourceHost == destination) {
            return;
        }
        var member = findGroupedAttraction(tripId, hostEntryId, attractionId).member();

        var contribution = member.contributionMinutes();
        var shortenedHost = sourceHost.withShortenedHostTiming(timingWithoutContribution(sourceHost.entry(), contribution));
        var destinationTiming = hostTimingWithContribution(destination, contribution);
        var proposedTimings = planTimingChange(withShortenedHost(itinerary, shortenedHost), destination, destinationTiming);
        proposedTimings.putIfAbsent(sourceHost.entry(), shortenedHost.timing());
        proposedTimings.put(destination.entry(), destinationTiming);
        proposedTimings.forEach(ItineraryEntry::changeTiming);
        sourceHost.entry().markGroupChanged();
        destination.entry().markGroupChanged();
        member.moveToHost(destinationEntryId, destination.lastMemberPosition() + 1);
    }

    public void extractGroupedAttraction(long tripId, long hostEntryId, long attractionId, LocalDate date,
                                         Long beforeEntryId, LocalTime start,
                                         List<ItineraryTransferSummary> transfersToRemoveAtInsertionPoint) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var host = findEntry(itinerary, tripId, hostEntryId);
        requireAttractionEntry(host.entry());
        validateDayInTrip(date, host.tripStart(), host.tripEnd());
        var grouped = findGroupedAttraction(tripId, hostEntryId, attractionId);
        var member = grouped.member();
        var shortenedHost = host.withShortenedHostTiming(timingWithoutContribution(host.entry(), member.contributionMinutes()));
        var proposedItinerary = withShortenedHost(itinerary, shortenedHost);
        var day = entriesOn(proposedItinerary, date);
        var position = beforeEntryId == null ? day.size() : day.indexOf(findEntry(day, tripId, beforeEntryId));
        var timing = extractionTiming(shortenedHost, day, date, position, start, member.contributionMinutes());
        var extracted = ItineraryEntry.fromGroup(tripId, member, position + 1, timing);
        var extractedSummary = new ItineraryTimingEditSummary(extracted, grouped.name(), null, host.tripStart(),
                host.tripEnd(), host.itineraryZone(), 0, 0);
        var proposedDay = new ArrayList<>(day);
        proposedDay.add(position, extractedSummary);

        var pushedTimings = validateMoveAndPushFollowingEntries(proposedDay, extractedSummary, timing, date,
                entriesNotOn(proposedItinerary, date));
        var disconnected = confirmedTransferRemovals(itinerary, Map.of(date, proposedDay),
                transfersToRemoveAtInsertionPoint);

        var pushesFollowingStarts = !pushedTimings.isEmpty();
        var newHostTiming = pushedTimings.remove(host.entry());
        clearTransfers(itinerary, disconnected);
        changeGroupTiming(host.entry(), newHostTiming == null ? shortenedHost.timing() : newHostTiming);
        extracted.moveTo(timing, pushesFollowingStarts);
        pushedTimings.forEach(ItineraryEntry::retimeForMove);
        renumberPathPositions(proposedDay);
        groupedAttractions.delete(member);
        entries.save(extracted);
    }

    private static ItineraryTiming extractionTiming(ItineraryTimingEditSummary host,
            List<ItineraryTimingEditSummary> day, LocalDate date, int position, LocalTime start, int minutes) {
        // Until there are zone-changing journeys, positions inherit the itinerary's initial zone.
        var zone = ZoneId.of(host.itineraryZone());
        if (day.isEmpty()) {
            if (start == null) {
                throw new BaseApiException(ITINERARY_INPUT_REQUIRED, new MissingInputs(List.of(RequiredInput.START)));
            }
            return new ItineraryTiming(date, start, zone, minutes);
        }
        if (start != null) {
            throw groupEditChanged("The requested extraction position already determines the start");
        }
        var anchor = position == 0 ? day.getFirst().timing().start().minusMinutes(minutes)
                : day.get(position - 1).timing().end();
        return ItineraryTiming.atInstant(anchor.toInstant(), zone, minutes);
    }

    private ItineraryGroupedAttractionEditSummary findGroupedAttraction(long tripId, long hostEntryId, long attractionId) {
        return groupedAttractions.findEditSummaryByTripIdAndHostEntryIdAndAttractionId(tripId, hostEntryId, attractionId)
                .orElseThrow(() -> groupEditChanged("The attraction is no longer grouped on the requested entry"));
    }

    private static List<ItineraryTimingEditSummary> withShortenedHost(
            List<ItineraryTimingEditSummary> itinerary, ItineraryTimingEditSummary shortenedHost) {
        return itinerary.stream().map(summary -> summary.entry() == shortenedHost.entry() ? shortenedHost : summary)
                .toList();
    }

    private static ItineraryTiming timingWithoutContribution(ItineraryEntry host, int contribution) {
        var saved = host.getTiming();
        return saved.withPlannedMinutes(saved.plannedMinutes() - contribution);
    }

    private static void changeGroupTiming(ItineraryEntry host, ItineraryTiming timing) {
        host.changeTiming(timing);
        host.markGroupChanged();
    }

    public void joinAttraction(long tripId, long hostEntryId, long attractionId, Long sourceEntryId,
                               String visitDuration, List<ItineraryTransferSummary> transfersToRemoveWithSourceEntry) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var host = findEntry(itinerary, tripId, hostEntryId);
        requireAttractionEntry(host.entry());
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
        return itinerary.stream().filter(entry -> Objects.equals(entry.entry().getAttractionId(), attractionId)).findFirst()
                .orElse(null);
    }

    private static void requireAttractionEntry(ItineraryEntry entry) {
        if (entry.getTypedItem() != null) {
            throw new BaseApiException("A typed item cannot host grouped attractions", ITINERARY_GROUP_JOIN_NOT_ALLOWED,
                    ItineraryTimingIssue.TYPED_ITEM);
        }
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
        validatePlannedLengthChange(editedEntry, newTiming.plannedMinutes());
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
        validatePlannedLengthChange(editedEntry, newTiming.plannedMinutes());
        applyNewTiming(itinerary, editedEntry, newTiming);
    }

    public void updateTransfer(long tripId, long fromEntryId, ItineraryTransfer transfer) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var departure = findEntry(itinerary, tripId, fromEntryId);
        var pushedTimings = planTransferTiming(itinerary, departure, transfer);

        departure.entry().changeOutgoingTransfer(transfer);
        pushedTimings.forEach(ItineraryEntry::changeTiming);
    }

    public void removeTransfer(long tripId, long fromEntryId, long toEntryId) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var departure = findEntry(itinerary, tripId, fromEntryId);
        requireTransferNeighbours(entriesOn(itinerary, departure.timing().date()), departure, toEntryId);
        departure.entry().changeOutgoingTransfer(null);
    }

    private static Map<ItineraryEntry, ItineraryTiming> planTransferTiming(List<ItineraryTimingEditSummary> itinerary,
            ItineraryTimingEditSummary departure, ItineraryTransfer transfer) {
        var timing = departure.timing();
        var date = timing.date();
        var day = entriesOn(itinerary, date);
        requireTransferNeighbours(day, departure, transfer.toEntryId());
        return pushFollowingEntries(day, departure, timing, entriesNotOn(itinerary, date),
                ItineraryTimingIssue.ENTRY, transfer);
    }

    private static void requireTransferNeighbours(List<ItineraryTimingEditSummary> day,
            ItineraryTimingEditSummary departure, long toEntryId) {
        var next = day.indexOf(departure) + 1;
        if (next == day.size() || day.get(next).entry().getId() != toEntryId) {
            throw new BaseApiException("Transfer endpoints are not consecutive on the same itinerary day",
                    RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.TRANSFER_NEIGHBOURS_CHANGED,
                    departure.entry().getId(), toEntryId);
        }
    }

    public void moveEntry(long tripId, long entryId, LocalDate date, Long beforeEntryId, String startOffset,
                          List<ItineraryTransferSummary> transfersToRemove) {
        var itinerary = entries.findTimingEditSummariesByTripId(tripId);
        var entryForMove = findEntry(itinerary, tripId, entryId);
        validateDayInTrip(date, entryForMove.tripStart(), entryForMove.tripEnd());
        var entriesOfDay = entriesOn(itinerary, date);
        var proposedDayOrder = proposeDayOrderForMove(entriesOfDay, entryForMove, beforeEntryId, tripId);
        if (proposedDayOrder.equals(entriesOfDay)) {
            ItineraryTransferRemovalSummary.requireListed(List.of(), transfersToRemove);
            return; // The same position keeps the interval, including free time before and after it.
        }
        moveToProposedDay(itinerary, proposedDayOrder, entryForMove, date, startOffset, transfersToRemove);
    }

    public void removeGroupedAttraction(long tripId, long hostEntryId, long attractionId) {
        var host = entries.findByIdAndTripId(hostEntryId, tripId)
                .orElseThrow(() -> entryNotFound(tripId, hostEntryId));
        requireAttractionEntry(host);
        var member = findGroupedAttraction(tripId, hostEntryId, attractionId).member();
        removeMember(host, member);
    }

    private void removeMember(ItineraryEntry host, ItineraryGroupedAttraction member) {
        changeGroupTiming(host, timingWithoutContribution(host, member.contributionMinutes()));
        groupedAttractions.delete(member);
    }

    public void removeEntry(long tripId, long entryId, List<ItineraryTransferSummary> transfersToRemove,
                            List<Long> groupedAttractionIdsToRemove) {
        var entryForRemoval = entries.findRemovalSummaryByTripIdAndEntryId(tripId, entryId)
                .orElseThrow(() -> entryNotFound(tripId, entryId));
        remove(tripId, entryForRemoval, ItineraryEntryRemoval.Cause.ITINERARY, transfersToRemove,
                groupedAttractionIdsToRemove);
    }

    public void unscheduleAttraction(long tripId, long attractionId, ItineraryRemoval itineraryRemoval,
                                     ItineraryEntryRemoval.Cause cause) {
        var entryForRemoval = entries.findRemovalSummaryByTripIdAndEntryId(tripId, itineraryRemoval.entryId())
                .orElseThrow(() -> boardRemovalChanged(tripId, attractionId));
        if (Objects.equals(entryForRemoval.entry().getAttractionId(), attractionId)) {
            remove(tripId, entryForRemoval, cause, itineraryRemoval.transfersToRemove(),
                    itineraryRemoval.groupedAttractionIdsToRemove());
            return;
        }
        if (!entryForRemoval.hasGroupedAttractions()) {
            throw boardRemovalChanged(tripId, attractionId);
        }
        var grouped = groupedAttractions.findEditSummaryByTripIdAndHostEntryIdAndAttractionId(
                    tripId, itineraryRemoval.entryId(), attractionId)
                .orElseThrow(() -> boardRemovalChanged(tripId, attractionId));
        requireSameMembers(List.of(), itineraryRemoval.groupedAttractionIdsToRemove());
        ItineraryTransferRemovalSummary.requireListed(List.of(), itineraryRemoval.transfersToRemove());
        removeMember(entryForRemoval.entry(), grouped.member());
    }

    private static BaseApiException boardRemovalChanged(long tripId, long attractionId) {
        return new BaseApiException("The board's itinerary removal no longer matches the itinerary",
                RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.BOARD_REMOVAL_CHANGED, tripId, attractionId);
    }

    private void remove(long tripId, ItineraryRemovalSummary entryForRemoval, ItineraryEntryRemoval.Cause cause,
                        List<ItineraryTransferSummary> transfersToRemove, List<Long> groupedAttractionIdsToRemove) {
        var groupedIds = entryForRemoval.hasGroupedAttractions()
                ? groupedAttractions.findAttractionIdsByTripIdAndHostEntryId(tripId, entryForRemoval.entry().getId())
                : List.<Long>of();
        requireSameMembers(groupedIds, groupedAttractionIdsToRemove);
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

    private static void validateDayInTrip(LocalDate date, LocalDate tripStart, LocalDate tripEnd) {
        if (date.isBefore(tripStart) || date.isAfter(tripEnd)) {
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

    private static void moveToProposedDay(List<ItineraryTimingEditSummary> itinerary,
            List<ItineraryTimingEditSummary> proposedDayOrder, ItineraryTimingEditSummary entryForMove,
            LocalDate date, String startOffset, List<ItineraryTransferSummary> transfersToRemove) {
        // The moved entry leaves its old day, so its saved interval there must not block the move.
        var entriesOfOtherDays = entriesNotOn(itinerary, date).stream()
                .filter(entry -> !entry.equals(entryForMove)).toList();

        var newTiming = chooseStartOccurrence(proposedDayOrder, entryForMove, date, entriesOfOtherDays,
                startOffset);
        var pushedTimings = validateMoveAndPushFollowingEntries(proposedDayOrder, entryForMove, newTiming, date,
                entriesOfOtherDays);
        var proposedDays = proposedDaysForMove(itinerary, proposedDayOrder, entryForMove, date);
        var disconnected = confirmedTransferRemovals(itinerary, proposedDays, transfersToRemove);

        clearTransfers(itinerary, disconnected);
        entryForMove.entry().moveTo(newTiming, !pushedTimings.isEmpty());
        pushedTimings.forEach(ItineraryEntry::retimeForMove);
        renumberPathPositions(proposedDayOrder);
    }

    private static Map<LocalDate, List<ItineraryTimingEditSummary>> proposedDaysForMove(
            List<ItineraryTimingEditSummary> itinerary, List<ItineraryTimingEditSummary> proposedDestinationDay,
            ItineraryTimingEditSummary moved, LocalDate destinationDate) {
        var sourceDate = moved.entry().getTiming().date();
        if (destinationDate.equals(sourceDate)) {
            return Map.of(destinationDate, proposedDestinationDay);
        }
        var proposedSourceDay = entriesOn(itinerary, sourceDate).stream().filter(entry -> !entry.equals(moved)).toList();
        return Map.of(sourceDate, proposedSourceDay, destinationDate, proposedDestinationDay);
    }

    private static List<ItineraryTransferRemovalSummary> confirmedTransferRemovals(
            List<ItineraryTimingEditSummary> itinerary, Map<LocalDate, List<ItineraryTimingEditSummary>> changedDays,
            List<ItineraryTransferSummary> transfersToRemove) {
        var disconnected = disconnectedTransfers(itinerary, changedDays);
        ItineraryTransferRemovalSummary.requireListed(disconnected, transfersToRemove);
        return disconnected;
    }

    private static List<ItineraryTransferRemovalSummary> disconnectedTransfers(List<ItineraryTimingEditSummary> itinerary,
            Map<LocalDate, List<ItineraryTimingEditSummary>> changedDays) {
        var nextEntryById = new HashMap<Long, Long>();
        changedDays.values().forEach(path -> connectNeighbours(nextEntryById, path));
        var byId = itinerary.stream().collect(Collectors.toMap(entry -> entry.entry().getId(), Function.identity()));
        var disconnected = new ArrayList<ItineraryTransferRemovalSummary>();
        for (var from : itinerary) {
            var departure = from.entry();
            if (!changedDays.containsKey(departure.getTiming().date())) {
                continue;
            }
            var transfer = departure.getOutgoingTransfer();
            if (transfer == null || Objects.equals(nextEntryById.get(departure.getId()), transfer.toEntryId())) {
                continue;
            }
            disconnected.add(new ItineraryTransferRemovalSummary(departure.getId(), from.name(),
                    byId.get(transfer.toEntryId()).name(), transfer));
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
        return validateAndPushFollowingEntries(entriesOfDay, entryForMove, newTiming, date, entriesOfOtherDays,
                ItineraryTimingIssue.MOVE_ENTRY);
    }

    private static Map<ItineraryEntry, ItineraryTiming> validateAndPushFollowingEntries(
            List<ItineraryTimingEditSummary> entriesOfDay, ItineraryTimingEditSummary editedEntry,
            ItineraryTiming newTiming, LocalDate date, List<ItineraryTimingEditSummary> entriesOfOtherDays,
            ItineraryTimingIssue issue) {
        validateStartsAfterPreviousEntry(entriesOfDay, editedEntry, newTiming, issue);
        validateNewTiming(editedEntry, newTiming, date, entriesOfOtherDays, issue);
        return pushFollowingEntries(entriesOfDay, editedEntry, newTiming, entriesOfOtherDays, issue);
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

    private static void validatePlannedLengthChange(ItineraryTimingEditSummary entry, int plannedMinutes) {
        if (entry.entry().getTypedItem() != null) {
            if (plannedMinutes < 1) {
                throw new BaseApiException("Typed item length must be positive", ITINERARY_PLANNED_LENGTH_NOT_ALLOWED,
                        ItineraryTimingIssue.TYPED_ITEM, entry.name());
            }
            return;
        }
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
        var pushedTimings = planTimingChange(itinerary, editedEntry, newTiming);
        editedEntry.entry().changeTiming(newTiming);
        pushedTimings.forEach(ItineraryEntry::changeTiming);
    }

    private static Map<ItineraryEntry, ItineraryTiming> planTimingChange(List<ItineraryTimingEditSummary> itinerary,
            ItineraryTimingEditSummary editedEntry, ItineraryTiming newTiming) {
        var date = editedEntry.timing().date();
        var entriesOfDay = entriesOn(itinerary, date);
        var entriesOfOtherDays = entriesNotOn(itinerary, date);

        return validateAndPushFollowingEntries(entriesOfDay, editedEntry, newTiming, date, entriesOfOtherDays,
                ItineraryTimingIssue.ENTRY);
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
        var arrival = arrivalAfter(previousEntry.timing().end(), transfer);
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
        entriesOfOtherDays.stream().filter(otherEntry -> newTiming.overlaps(otherEntry.timing()))
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
            if (!followingEntry.timing().start().isBefore(arrival)) {
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
        var toEntryId = to.entry().getId();
        return toEntryId == null ? null : ItineraryTransfer.between(from.entry().getOutgoingTransfer(), toEntryId);
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
        return entry.timing().withStartAt(newStart.toInstant());
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
