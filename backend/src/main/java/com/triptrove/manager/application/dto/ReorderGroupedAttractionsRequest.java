package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record ReorderGroupedAttractionsRequest(@NotEmpty List<@NotNull @Positive Long> attractionIds) {
}
