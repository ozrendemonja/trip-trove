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
import java.util.OptionalInt;
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

        validateAttractionCanBeScheduled(tripAttraction, attractionId, itinerary);
        validateVisitDurationCanBeProvided(tripAttraction.visitDuration(), attraction.visitDuration());

        var visitDurationMinutes = resolveVisitDurationMinutes(tripAttraction.visitDuration(), attraction.visitDuration())
                .orElseThrow(() -> new BaseApiException(ITINERARY_INPUT_REQUIRED,
                        new MissingInputs(List.of(RequiredInput.VISIT_DURATION))));
        validateStartAndTimeZone(attraction.start(), itineraryTimeZone);

        var zone = requireNamedTimeZone(itineraryTimeZone);
        var proposedInterval = new ItineraryTiming(date, attraction.start(), zone, visitDurationMinutes);
        validateProposedIntervalFitsItinerary(proposedInterval, itinerary);

        if (itinerary.timeZone() == null) {
            itineraries.getReferenceById(tripId).initializeTimeZone(itineraryTimeZone);
        }
        if (attraction.visitDuration() != null) {
            tripAttractions.findById(tripAttraction.tripAttractionId()).orElseThrow().setVisitTime(attraction.visitDuration());
        }
        var position = prepareInsertionPosition(tripId, day, proposedInterval);
        entries.save(new ItineraryEntry(tripId, attractionId, position, proposedInterval));
    }

    private void validateAttractionCanBeScheduled(SchedulingSummary attraction, long attractionId,
                                                  ItinerarySummary itinerary) {
        if (!TripAttraction.isEligibleForScheduling(attraction.group(), attraction.permanentlyClosedAt())) {
            throw new BaseApiException("Attraction is not eligible for scheduling", ITINERARY_ATTRACTION_INELIGIBLE);
        }
        if (itinerary.isAlreadyScheduled(attractionId)) {
            throw new BaseApiException("The attraction already has an itinerary entry", ITINERARY_ATTRACTION_ALREADY_SCHEDULED);
        }
    }

    private void validateVisitDurationCanBeProvided(String sourceDuration, String requestedDuration) {
        if (requestedDuration != null && VisitDuration.upperBound(sourceDuration).isPresent()) {
            throw new BaseApiException("Scheduling can correct only an unusable source duration",
                    ITINERARY_DURATION_ALREADY_VALID);
        }
    }

    private OptionalInt resolveVisitDurationMinutes(String sourceDuration, String requestedDuration) {
        return VisitDuration.upperBound(requestedDuration == null ? sourceDuration : requestedDuration);
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
        if (itinerary.hasOverlap(proposedInterval)) {
            throw new BaseApiException("Proposed interval overlaps a saved entry", ITINERARY_ENTRY_OVERLAP);
        }
    }

    private int prepareInsertionPosition(Long tripId, ItineraryDaySummary day, ItineraryTiming proposedInterval) {
        var lastPosition = day.lastPosition();
        var position = day.firstPositionAfter(proposedInterval).orElse(lastPosition + 1);
        if (position <= lastPosition) {
            // Move the suffix past the current tail before shifting it back, so unique positions never collide.
            var offset = lastPosition - position + 2;
            entries.shiftPositionsFrom(tripId, day.date(), position, offset);
            entries.shiftPositionsFrom(tripId, day.date(), position + offset, 1 - offset);
        }
        return position;
    }
}
