package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.AssertFalse;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record UpdateAttractionDestinationRequest(@NotNull Boolean isCountrywide,
                                                 Integer regionId,
                                                 Integer cityId) {
    @AssertTrue(message = "regionId or cityId is required")
    boolean isRegionIdOrCityId() {
        return regionId != null || cityId != null;
    }

    @AssertFalse(message = "regionId and cityId cannot be present simultaneously")
    boolean isRegionIdAndCityId() {
        return regionId != null && cityId != null;
    }

}
