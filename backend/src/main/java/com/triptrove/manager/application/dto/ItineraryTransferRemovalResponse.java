package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryTransferRemovalSummary;
import io.swagger.v3.oas.annotations.media.Schema;

public record ItineraryTransferRemovalResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ItineraryTransferDTO transfer,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String fromName,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String toName) {
    public static ItineraryTransferRemovalResponse from(ItineraryTransferRemovalSummary removal) {
        return new ItineraryTransferRemovalResponse(ItineraryTransferDTO.from(removal.transfer()),
                removal.fromName(), removal.toName());
    }
}
