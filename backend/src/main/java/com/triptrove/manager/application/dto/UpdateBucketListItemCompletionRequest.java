package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.AssertTrue;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record UpdateBucketListItemCompletionRequest(
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate completedOn,
        Long tripId,
        Boolean wouldRepeat) {

    @AssertTrue(message = "A completed bucket list item must have a trip and a repeat preference")
    public boolean isTripValid() {
        return (tripId == null) == (completedOn == null)
                && (tripId == null || wouldRepeat != null);
    }
}