package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record ExtractGroupedAttractionRequest(
        @NotNull LocalDate date,
        @Positive @Schema(description = "Entry to insert before, or omit to insert last.") Long beforeEntryId,
        @Pattern(regexp = ScheduleAttractionRequest.LOCAL_CLOCK_PATTERN)
        @Schema(description = "Local start clock when the destination day has no entries.", example = "09:00")
        String startTime,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemoveAtInsertionPoint) {
}
