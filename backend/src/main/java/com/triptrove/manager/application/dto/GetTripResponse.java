package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Trip;

import java.time.LocalDate;

public record GetTripResponse(String tripName, LocalDate fromDate, LocalDate toDate) {
    public static GetTripResponse from(Trip trip) {
        return new GetTripResponse(trip.getName(), trip.getFrom(), trip.getTo());
    }
}
