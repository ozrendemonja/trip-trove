package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MoveAttractionOnBoardRequest(
        @NotNull TripAttractionGroupDTO targetGroup,
        @Positive Long previousAttractionId,
        @Positive Long nextAttractionId) {
}