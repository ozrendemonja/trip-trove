package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateBucketListItemDescriptionRequest(
        @Size(max = 4096, message = "Bucket list item description may not be longer than {max}")
        String description) {
}