package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewTripAttractionRequest(@NotNull RatingDTO rating,
                                          @Size(max = 512, message = "Review note may not be longer then {max}")
                                          String reviewNote) {
}
