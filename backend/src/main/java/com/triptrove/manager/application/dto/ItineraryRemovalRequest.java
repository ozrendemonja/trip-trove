package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryRemoval;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record ItineraryRemovalRequest(@NotNull @Positive Long entryId,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemove) {
    public ItineraryRemovalRequest(Long entryId) {
        this(entryId, null);
    }

    public ItineraryRemoval toItineraryRemoval() {
        return new ItineraryRemoval(entryId, ItineraryTransferDTO.toSummaries(transfersToRemove));
    }
}
