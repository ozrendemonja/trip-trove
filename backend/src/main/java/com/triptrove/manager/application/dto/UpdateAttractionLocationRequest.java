package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateAttractionLocationRequest(
        @Size(max = 512, message = "Attraction address may not be longer then {max}")
        String attractionAddress,
        LocationDTO attractionLocation) {
}
