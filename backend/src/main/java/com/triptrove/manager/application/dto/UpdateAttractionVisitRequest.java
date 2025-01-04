package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateAttractionVisitRequest(@NotNull
                                           Boolean mustVisit) {
}
