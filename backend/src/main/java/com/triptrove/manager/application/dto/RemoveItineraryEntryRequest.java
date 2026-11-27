package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryTransferSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RemoveItineraryEntryRequest(List<@NotNull @Valid ItineraryTransferDTO> transfersToRemove) {
    public List<ItineraryTransferSummary> transferSummariesToRemove() {
        return ItineraryTransferDTO.toSummaries(transfersToRemove);
    }
}
