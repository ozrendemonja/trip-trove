package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.AssertTrue;

public record UpdateBucketListItemLocationRequest(Integer cityId, Integer regionId) {

    @AssertTrue(message = "Select either a city or a region, not both")
    public boolean isLocationValid() {
        return cityId == null || regionId == null;
    }
}