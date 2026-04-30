package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record GetVisitHistoryRequest(
        @NotNull
        @Size(max = 100, message = "attractionIds may not contain more than 100 elements")
        List<Long> attractionIds) {
}
