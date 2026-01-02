package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.Month;

public record UpdateTripRangeRequest(@NotNull
                                     LocalDate fromDate,
                                     @NotNull
                                     LocalDate toDate) {
    private static final LocalDate MIN_DATE = LocalDate.of(1960, Month.JANUARY, 1);

    @AssertTrue(message = "fromDate must be on or before toDate")
    public boolean isFromDateNotAfterToDate() {
        // Let @NotNull handle nulls; avoid double-reporting
        if (fromDate == null || toDate == null) return true;
        return !fromDate.isAfter(toDate);
    }

    @AssertTrue(message = "Dates must not be before 1960-01-01")
    public boolean isDatesNotBefore1960() {
        if (fromDate != null && fromDate.isBefore(MIN_DATE)) return false;
        if (toDate != null && toDate.isBefore(MIN_DATE)) return false;
        return true;
    }
}
