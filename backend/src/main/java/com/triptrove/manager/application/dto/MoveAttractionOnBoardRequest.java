package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryRemoval;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MoveAttractionOnBoardRequest(
        @NotNull TripAttractionGroupDTO targetGroup,
        @Positive Long previousAttractionId,
        @Positive Long nextAttractionId,
        @Valid ItineraryRemovalRequest itineraryRemoval) {
    public MoveAttractionOnBoardRequest(TripAttractionGroupDTO targetGroup, Long previousAttractionId, Long nextAttractionId) {
        this(targetGroup, previousAttractionId, nextAttractionId, null);
    }

    public ItineraryRemoval toItineraryRemoval() {
        return itineraryRemoval == null ? null : itineraryRemoval.toItineraryRemoval();
    }
}