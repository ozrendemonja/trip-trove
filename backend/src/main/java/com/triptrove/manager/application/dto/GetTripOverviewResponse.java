package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.TripOverviewSummary;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetTripOverviewResponse(
        Long tripId, String tripName, LocalDate fromDate, LocalDate toDate, LocalDateTime changedOn, boolean archived,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean hasItineraryEntries,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean hasItineraryDayNotes) {
    public static GetTripOverviewResponse from(TripOverviewSummary trip) {
        return new GetTripOverviewResponse(trip.id(), trip.name(), trip.from(), trip.to(), trip.changedOn(),
                trip.archived(), trip.hasItineraryEntries(), trip.hasItineraryDayNotes());
    }
}
