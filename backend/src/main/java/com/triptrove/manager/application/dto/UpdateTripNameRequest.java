package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTripNameRequest(@NotBlank(message = "Trip name may not be null or empty")
                                    @Size(max = 512, message = "Trip name may not be longer then {max}")
                                    String tripName) {
}
