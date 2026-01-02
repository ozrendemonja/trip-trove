package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddAttractionUnderTripRequest(@NotNull RatingDTO rating,
                                            @Size(max = 512, message = "Note may not be longer then {max}")
                                            String note) {
}