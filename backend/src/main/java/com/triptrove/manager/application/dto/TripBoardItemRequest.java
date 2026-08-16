package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TripBoardItemRequest(@NotNull @Positive Long attractionId,
                                   @NotNull TripAttractionGroupDTO group) {
}