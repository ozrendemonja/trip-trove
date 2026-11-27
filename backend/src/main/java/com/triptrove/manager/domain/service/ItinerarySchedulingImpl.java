package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.model.AttractionToSchedule.MissingInputs;
import com.triptrove.manager.domain.model.AttractionToSchedule.RequiredInput;
import com.triptrove.manager.domain.repo.ItineraryEntryRepo;
import com.triptrove.manager.domain.repo.ItineraryRepo;
import com.triptrove.manager.domain.repo.TripAttractionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.*;

@Service
@RequiredArgsConstructor
public class ItinerarySchedulingImpl implements ItineraryScheduling {
    private static final Set<String> NAMED_ZONES = Set.copyOf(ZoneId.getAvailableZoneIds());

    private final ItineraryRepo itineraries;
    private final ItineraryEntryRepo entries;
    private final TripAttractionRepo tripAttractions;

    @Override
    @Transactional
    public void scheduleAttractionOnDay(Long tripId, LocalDate date, AttractionToSchedule attraction) {
        var attractionId = attraction.attractionId();

        var itinerary = itineraries.findSummaryByTripId(tripId)
                .orElseThrow(() -> new BaseApiException("Itinerary not found for trip", RESOURCE_NOT_FOUND, tripId));
        var tripAttraction = tripAttractions.findSchedulingSummaryByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found in trip", RESOURCE_NOT_FOUND, attractionId, tripId));
        var day = itinerary.findDay(date)
                .orElseThrow(() -> new BaseApiException("No itinerary day for the selected date",
                        ITINERARY_DAY_NOT_IN_TRIP, date));
        var itineraryTimeZone = itinerary.timeZone() == null && attraction.timeZone() != null
                ? attraction.timeZone().strip() : itinerary.timeZone();

        tripAttraction.requireEligible(false);
        if (tripAttraction.groupedUnderEntryId() != null || itinerary.isAlreadyScheduled(attractionId)) {
            throw new BaseApiException("The attraction already has an itinerary placement", ITINERARY_ATTRACTION_ALREADY_SCHEDULED);
        }
        var visitDurationMinutes = tripAttraction.resolveVisitDurationMinutes(attraction.visitDuration());
        validateStartAndTimeZone(attraction.start(), itineraryTimeZone);

        var zone = requireNamedTimeZone(itineraryTimeZone);
        var proposedInterval = ItineraryTiming.atLocalStart(date, attraction.start(), zone, visitDurationMinutes,
                attraction.startOffset());
        validateProposedIntervalFitsItinerary(proposedInterval, itinerary);

        var lastPosition = day.lastPosition();
        var position = day.firstPositionAfter(proposedInterval).orElse(lastPosition + 1);
        // The unchanged visits bound every retained transfer. Only the transfer across the insertion can be lost.
        var disconnectedTransfers = day.transfersToRemoveForInsertionAt(position);
        ItineraryTransferRemovalSummary.requireListed(disconnectedTransfers, attraction.transfersToRemove());

        if (itinerary.timeZone() == null) {
            itineraries.getReferenceById(tripId).initializeTimeZone(itineraryTimeZone);
        }
        if (attraction.visitDuration() != null) {
            tripAttractions.correctSchedulingDuration(tripAttraction.tripAttractionId(), attraction.visitDuration());
        }
        for (var removal : disconnectedTransfers) {
            var transfer = removal.transfer();
            if (entries.disconnectTransfer(tripId, transfer.fromEntryId(), transfer.toEntryId()) != 1) {
                throw new IllegalStateException("Could not disconnect listed transfer " + transfer.fromEntryId());
            }
        }
        makeRoomForInsertion(tripId, day.date(), position, lastPosition);
        entries.save(new ItineraryEntry(tripId, attractionId, position, proposedInterval));
    }

    private void validateStartAndTimeZone(LocalTime requestedStart, String itineraryTimeZone) {
        var required = new ArrayList<RequiredInput>();
        if (requestedStart == null) {
            required.add(RequiredInput.START);
        }
        if (itineraryTimeZone == null || itineraryTimeZone.isBlank()) {
            required.add(RequiredInput.TIME_ZONE);
        }
        if (!required.isEmpty()) {
            throw new BaseApiException(ITINERARY_INPUT_REQUIRED, new MissingInputs(List.copyOf(required)));
        }
    }

    private ZoneId requireNamedTimeZone(String itineraryTimeZone) {
        if (!NAMED_ZONES.contains(itineraryTimeZone)) {
            throw new BaseApiException("Not a named time zone", ITINERARY_UNKNOWN_ZONE, itineraryTimeZone);
        }
        return ZoneId.of(itineraryTimeZone);
    }

    private void validateProposedIntervalFitsItinerary(ItineraryTiming proposedInterval, ItinerarySummary itinerary) {
        if (!proposedInterval.fitsTripDates(itinerary.tripStart(), itinerary.tripEnd())) {
            throw new BaseApiException("Proposed interval would extend past the trip", ITINERARY_END_OUTSIDE_TRIP,
                    itinerary.tripEnd());
        }
        itinerary.findOverlap(proposedInterval).ifPresent(entry -> {
            if (entry.fixedStart()) {
                throw new BaseApiException("Proposed interval overlaps a fixed entry", ITINERARY_ENTRY_OVERLAP,
                        ItineraryTimingIssue.SCHEDULING_FIXED_START, entry.name());
            }
            throw new BaseApiException("Proposed interval overlaps a saved entry", ITINERARY_ENTRY_OVERLAP);
        });
    }

    private void makeRoomForInsertion(Long tripId, LocalDate date, int position, int lastPosition) {
        if (position <= lastPosition) {
            // Move the suffix past the current tail before shifting it back, so unique positions never collide.
            var offset = lastPosition - position + 2;
            entries.shiftPositionsFrom(tripId, date, position, offset);
            entries.shiftPositionsFrom(tripId, date, position + offset, 1 - offset);
        }
    }
}
