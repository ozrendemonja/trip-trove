package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateAttractionGroupRequest(@NotNull TripAttractionGroupDTO attractionGroup) {
}
