package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.triptrove.manager.domain.model.ItineraryDetails;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetItineraryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long tripId,
        String initialZone,
        @Schema(description = "Absent until the itinerary has been manually checked.") Instant lastCheckedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<Day> days) {
    public record Day(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate date) {
    }

    public static GetItineraryResponse from(ItineraryDetails itinerary) {
        var days = itinerary.days().stream().map(day -> new Day(day.id(), day.date())).toList();
        return new GetItineraryResponse(itinerary.tripId(), itinerary.initialZone(), itinerary.lastCheckedAt(), days);
    }
}
