package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DateSpanDTO(@NotNull
                          LocalDate fromDate,
                          @NotNull
                          LocalDate toDate) {
}
