package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateTripAttractionMustVisitRequest(@NotNull Boolean mustVisit) {
}
