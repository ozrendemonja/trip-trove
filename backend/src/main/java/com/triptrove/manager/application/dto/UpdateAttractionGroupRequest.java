package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryRemovalConfirmation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateAttractionGroupRequest(@NotNull TripAttractionGroupDTO attractionGroup,
                                           @Valid ConfirmItineraryEntryRemovalRequest confirmedRemoval) {
    public UpdateAttractionGroupRequest(TripAttractionGroupDTO attractionGroup) {
        this(attractionGroup, null);
    }

    public ItineraryRemovalConfirmation removalConfirmation() {
        return confirmedRemoval == null ? null : new ItineraryRemovalConfirmation(confirmedRemoval.entryId());
    }
}
