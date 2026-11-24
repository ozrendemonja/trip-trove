package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record MoveItineraryEntryRequest(
        @NotNull LocalDate date,
        @Positive @Schema(description = "Entry to insert before, or omit to insert last.") Long beforeEntryId,
        @Size(max = 9) @Schema(description = "Offset selected when the same local start fits twice.") String startOffset) {
}
