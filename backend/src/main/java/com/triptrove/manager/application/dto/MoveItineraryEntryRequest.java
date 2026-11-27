package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryTransferSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record MoveItineraryEntryRequest(
        @NotNull LocalDate date,
        @Positive @Schema(description = "Entry to insert before, or omit to insert last.") Long beforeEntryId,
        @Size(max = 9) @Schema(description = "Offset selected when the same local start fits twice.") String startOffset,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemove) {
    public MoveItineraryEntryRequest(LocalDate date, Long beforeEntryId, String startOffset) {
        this(date, beforeEntryId, startOffset, null);
    }

    public List<ItineraryTransferSummary> transferSummariesToRemove() {
        return ItineraryTransferDTO.toSummaries(transfersToRemove);
    }
}
