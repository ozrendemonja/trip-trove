package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckItineraryRequest(
        @NotBlank @Size(max = 64)
        @Schema(description = "The check context from the displayed itinerary.")
        String checkContext) {
}
