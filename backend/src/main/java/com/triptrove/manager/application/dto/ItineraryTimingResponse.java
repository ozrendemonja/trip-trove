package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.triptrove.manager.domain.model.ItineraryTiming;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.ZoneId;

public record ItineraryTimingResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String zone,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "2027-10-31T02:30+02:00") String start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "2027-10-31T02:45+02:00") String end,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "True when the start clock repeats in its zone; absent otherwise.") Boolean repeatedStart,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "True when the end clock repeats in its zone; absent otherwise.") Boolean repeatedEnd) {
    public static ItineraryTimingResponse from(ItineraryTiming timing) {
        var start = timing.start();
        var end = timing.end();
        var rules = ZoneId.of(timing.zone()).getRules();
        return new ItineraryTimingResponse(timing.zone(), start.toString(), end.toString(),
                rules.getValidOffsets(start.toLocalDateTime()).size() > 1 ? true : null,
                rules.getValidOffsets(end.toLocalDateTime()).size() > 1 ? true : null);
    }
}
