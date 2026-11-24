package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateItineraryEntryFixedStartRequest(@NotNull Boolean fixedStart) implements ItineraryTimingRequest {
}
