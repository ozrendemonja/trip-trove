package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateTripAttractionWorkingHoursRequest(
        @Size(max = 128, message = "Working hours may not be longer then 128")
        String workingHours) {
}
