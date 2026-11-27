package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record JoinItineraryAttractionRequest(
        @NotNull @Positive Long attractionId,
        @Positive
        @Schema(description = "ID of the attraction's own itinerary entry to remove when it joins the host.")
        Long sourceEntryId,
        @Size(max = 64) String visitDuration,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemoveWithSourceEntry) {

    @AssertTrue(message = "omit visitDuration when sourceEntryId is set; the source entry's planned length is used")
    @Schema(hidden = true)
    public boolean isDurationCorrectionForUnscheduledAttraction() {
        return sourceEntryId == null || visitDuration == null;
    }
}
