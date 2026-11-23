package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryTiming;
import io.swagger.v3.oas.annotations.media.Schema;

public record ItineraryTimingResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String zone,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "2027-10-31T02:30+02:00") String start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "2027-10-31T02:45+02:00") String end) {
    public static ItineraryTimingResponse from(ItineraryTiming timing) {
        return new ItineraryTimingResponse(timing.zone(), timing.start().toString(), timing.end().toString());
    }
}
