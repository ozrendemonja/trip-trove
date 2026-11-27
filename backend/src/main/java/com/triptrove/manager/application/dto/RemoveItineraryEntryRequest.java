package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryTransferSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record RemoveItineraryEntryRequest(
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemove,
        List<@NotNull @Positive Long> groupedAttractionIdsToRemove) {
    public RemoveItineraryEntryRequest(List<ItineraryTransferDTO> transfersToRemove) {
        this(transfersToRemove, null);
    }

    public List<ItineraryTransferSummary> transferSummariesToRemove() {
        return ItineraryTransferDTO.toSummaries(transfersToRemove);
    }
}
