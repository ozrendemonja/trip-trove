package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryDay;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateItineraryDayNoteRequest(
        @NotNull(message = "Day note is required")
        @Size(max = ItineraryDay.NOTE_MAX_LENGTH, message = "Day note may not be longer than {max} characters")
        @Pattern(regexp = "[^\\x00]*", message = "Day note must not contain a null character")
        @Schema(description = "Plain text. Send an empty string to clear the note.")
        String note) {
}
