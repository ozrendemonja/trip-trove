package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

import static com.triptrove.manager.application.dto.ScheduleAttractionRequest.LOCAL_CLOCK_PATTERN;

@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateItineraryEntryEndRequest(
        @NotNull LocalDate endDate,
        @NotNull @Pattern(regexp = LOCAL_CLOCK_PATTERN, message = "enter a local clock as HH:mm or HH:mm:ss")
        @Schema(example = "10:00") String endTime) implements ItineraryTimingRequest {
}
