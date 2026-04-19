package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateTripAttractionVisitTimeRequest(
        @Size(max = 64, message = "Visit time may not be longer then 64")
        String visitTime) {
}
