package com.triptrove.manager.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ArrangeTripBoardRequest(
        @NotNull
        List<@Valid TripBoardItemRequest> attractions) {
}