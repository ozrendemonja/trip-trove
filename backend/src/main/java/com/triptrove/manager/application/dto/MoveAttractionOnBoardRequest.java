package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryRemovalConfirmation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MoveAttractionOnBoardRequest(
        @NotNull TripAttractionGroupDTO targetGroup,
        @Positive Long previousAttractionId,
        @Positive Long nextAttractionId,
        @Valid ConfirmItineraryEntryRemovalRequest confirmedRemoval) {
    public MoveAttractionOnBoardRequest(TripAttractionGroupDTO targetGroup, Long previousAttractionId, Long nextAttractionId) {
        this(targetGroup, previousAttractionId, nextAttractionId, null);
    }

    public ItineraryRemovalConfirmation removalConfirmation() {
        return confirmedRemoval == null ? null : new ItineraryRemovalConfirmation(confirmedRemoval.entryId());
    }
}