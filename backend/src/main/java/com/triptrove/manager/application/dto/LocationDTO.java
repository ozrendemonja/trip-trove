package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LocationDTO(
        @NotNull
        @Size(min = -90, max = 90, message = "Latitude must be between {min} and {max} to be valid")
        Double latitude,
        @NotNull
        @Size(min = -180, max = 180, message = "Longitude must be between {min} and {max} to be valid")
        Double longitude) {
}
