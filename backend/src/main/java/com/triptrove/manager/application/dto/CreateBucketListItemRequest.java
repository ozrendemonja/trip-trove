package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBucketListItemRequest(
        @NotBlank(message = "Bucket list item name may not be null or empty")
        @Size(max = 256, message = "Bucket list item name may not be longer than {max}")
        String name,
        Integer cityId,
        Integer regionId,
        @Size(max = 4096, message = "Bucket list item description may not be longer than {max}")
        String description) {

    @AssertTrue(message = "Select either a city or a region, not both")
    public boolean isLocationValid() {
        return cityId == null || regionId == null;
    }
}