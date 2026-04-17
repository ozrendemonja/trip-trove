package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateTripAttractionPlanNoteRequest(
        @Size(max = 512, message = "Plan note may not be longer then 512")
        String planNote) {
}
