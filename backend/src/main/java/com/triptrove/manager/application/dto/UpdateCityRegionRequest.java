package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateCityRegionRequest(@NotNull Integer regionId) {
}
