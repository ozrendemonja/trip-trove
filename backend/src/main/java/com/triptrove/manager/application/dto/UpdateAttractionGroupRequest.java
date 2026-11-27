package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryRemoval;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateAttractionGroupRequest(@NotNull TripAttractionGroupDTO attractionGroup,
                                           @Valid ItineraryRemovalRequest itineraryRemoval) {
    public UpdateAttractionGroupRequest(TripAttractionGroupDTO attractionGroup) {
        this(attractionGroup, null);
    }

    public ItineraryRemoval toItineraryRemoval() {
        return itineraryRemoval == null ? null : itineraryRemoval.toItineraryRemoval();
    }
}
