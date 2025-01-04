package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAttractionDetailRequest(@NotBlank(message = "Attraction name may not be null or empty")
                                            @Size(max = 2048, message = "Attraction name may not be longer then {max}")
                                            String attractionName,
                                            Long mainAttractionId
) {
}
