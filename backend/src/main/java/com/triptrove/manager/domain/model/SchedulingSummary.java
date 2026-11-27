package com.triptrove.manager.domain.model;

import com.triptrove.manager.domain.model.AttractionToSchedule.MissingInputs;
import com.triptrove.manager.domain.model.AttractionToSchedule.RequiredInput;

import java.time.LocalDateTime;
import java.util.List;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.*;

public record SchedulingSummary(Long tripAttractionId, TripAttractionGroup group, LocalDateTime permanentlyClosedAt,
                                String visitDuration, Long groupedUnderEntryId) {
    public void requireEligible(boolean movingScheduledAttraction) {
        if (!TripAttraction.isEligibleForScheduling(group, movingScheduledAttraction ? null : permanentlyClosedAt)) {
            throw new BaseApiException("Attraction is not eligible for scheduling", ITINERARY_ATTRACTION_INELIGIBLE);
        }
    }

    public int resolveVisitDurationMinutes(String requestedDuration) {
        if (requestedDuration != null && VisitDuration.upperBound(visitDuration).isPresent()) {
            throw new BaseApiException("Scheduling can correct only an unusable source duration",
                    ITINERARY_DURATION_ALREADY_VALID);
        }
        return VisitDuration.upperBound(requestedDuration == null ? visitDuration : requestedDuration)
                .orElseThrow(() -> new BaseApiException(ITINERARY_INPUT_REQUIRED,
                        new MissingInputs(List.of(RequiredInput.VISIT_DURATION))));
    }
}
