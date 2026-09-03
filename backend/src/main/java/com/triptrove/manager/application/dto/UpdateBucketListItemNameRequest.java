package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBucketListItemNameRequest(
        @NotBlank(message = "Bucket list item name may not be null or empty")
        @Size(max = 256, message = "Bucket list item name may not be longer than {max}")
        String name) {
}