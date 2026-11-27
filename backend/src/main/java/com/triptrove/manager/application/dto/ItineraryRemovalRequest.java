package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryRemoval;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record ItineraryRemovalRequest(
        @NotNull @Positive @Schema(description = "Entry to remove, or the host entry of a grouped attraction.") Long entryId,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemove,
        @Schema(description = "All grouped attraction IDs that will be unscheduled when removing a host.")
        List<@NotNull @Positive Long> groupedAttractionIdsToRemove) {
    public ItineraryRemovalRequest(Long entryId) {
        this(entryId, null, null);
    }

    public ItineraryRemovalRequest(Long entryId, List<ItineraryTransferDTO> transfersToRemove) {
        this(entryId, transfersToRemove, null);
    }

    public ItineraryRemoval toItineraryRemoval() {
        return new ItineraryRemoval(entryId, ItineraryTransferDTO.toSummaries(transfersToRemove),
                groupedAttractionIdsToRemove == null ? List.of() : groupedAttractionIdsToRemove);
    }
}
