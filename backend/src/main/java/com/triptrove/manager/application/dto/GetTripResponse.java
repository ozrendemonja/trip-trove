package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Trip;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetTripResponse(Long tripId, String tripName, LocalDate fromDate, LocalDate toDate,
                              @Schema(description = "Effective last modification time, falling back to creation time when never modified. Reuse this exact value as updatedOn with tripId.")
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                              LocalDateTime changedOn,
                              boolean archived) {
    public static GetTripResponse from(Trip trip) {
        var changedOn = trip.getUpdatedOn() == null ? trip.getCreatedOn() : trip.getUpdatedOn();
        return new GetTripResponse(trip.getId(), trip.getName(), trip.getFrom(), trip.getTo(), changedOn, trip.isArchived());
    }
}
