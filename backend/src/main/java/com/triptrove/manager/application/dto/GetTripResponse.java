package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Trip;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetTripResponse(Long tripId, String tripName, LocalDate fromDate, LocalDate toDate,
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                              LocalDateTime changedOn) {
    public static GetTripResponse from(Trip trip) {
        return new GetTripResponse(trip.getId(), trip.getName(), trip.getFrom(), trip.getTo(), trip.getCreatedOn());
    }
}
