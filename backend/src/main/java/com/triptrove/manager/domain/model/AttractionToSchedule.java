package com.triptrove.manager.domain.model;

import java.time.LocalTime;
import java.util.List;

public record AttractionToSchedule(Long attractionId, LocalTime start, String timeZone, String visitDuration,
                                   String startOffset) {
    public enum RequiredInput {
        START, TIME_ZONE, VISIT_DURATION
    }

    public record MissingInputs(List<RequiredInput> requiredInputs) {
    }
}
