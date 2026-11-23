package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import static com.triptrove.manager.application.dto.ScheduleAttractionRequest.LOCAL_CLOCK_PATTERN;

@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateItineraryEntryStartRequest(
        @NotNull @Pattern(regexp = LOCAL_CLOCK_PATTERN, message = "enter a local clock as HH:mm or HH:mm:ss")
        @Schema(example = "09:00") String startTime) implements ItineraryTimingRequest {
}
