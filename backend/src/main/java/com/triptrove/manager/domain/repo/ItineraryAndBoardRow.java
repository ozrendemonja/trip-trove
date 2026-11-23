package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.AttractionCategory;
import com.triptrove.manager.domain.model.ItineraryDetails.AttractionEntrySummary;
import com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary;
import com.triptrove.manager.domain.model.ItineraryDetails.UnscheduledAttractionSummary;
import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.TripAttraction;
import com.triptrove.manager.domain.model.TripAttractionGroup;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary.Reason.*;

public record ItineraryAndBoardRow(Long tripId, String timeZone, Instant lastCheckedAt,
                                   Long itineraryDayId, LocalDate itineraryDate,
                                   Long attractionId, String attractionName, String cityName, String regionName, String countryName,
                                   TripAttractionGroup boardColumn, Boolean mustVisit, AttractionCategory category,
                                   String workingHours, String visitDuration, LocalDateTime permanentlyClosedAt,
                                   Long entryId, LocalDate entryDate, Integer entryPosition, Boolean entryFixedStart,
                                   ItineraryTiming entryTiming, Boolean entryIncludedInLastCheck,
                                   Boolean startChangedSinceCheck, Boolean plannedLengthChangedSinceCheck) {
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
                category, workingHours, visitDuration);
    }

    AttractionEntrySummary toEntrySummary() {
        return new AttractionEntrySummary(entryId, attractionId, attractionName, boardColumn, mustVisit,
                category, entryPosition, entryFixedStart, entryTiming);
    }

    ChangeNoticeSummary toChangeNotice() {
        var reasons = new ArrayList<ChangeNoticeSummary.Reason>(3);
        if (!entryIncludedInLastCheck) {
            reasons.add(ATTRACTION_ADDED);
        }
        if (startChangedSinceCheck) {
            reasons.add(START_CHANGED);
        }
        if (plannedLengthChangedSinceCheck) {
            reasons.add(PLANNED_LENGTH_CHANGED);
        }
        return new ChangeNoticeSummary(entryId, attractionName, entryDate, List.copyOf(reasons));
    }
}
