package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ConfirmItineraryEntryRemovalRequest(@NotNull @Positive Long entryId) {
}
