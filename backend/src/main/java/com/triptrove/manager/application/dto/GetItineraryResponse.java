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
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<Day> days,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED,
                description = "Eligible, unplaced attractions in board column, place and card order.")
        List<UnscheduledAttraction> unscheduledAttractions) {
    public record Day(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate date) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UnscheduledAttraction(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long attractionId,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String place,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) TripAttractionGroupDTO attractionGroup,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean mustVisit,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) AttractionCategoryResponse category,
            String workingHours,
            String visitDuration) {
        private static UnscheduledAttraction from(ItineraryDetails.UnscheduledAttractionSummary attraction) {
            return new UnscheduledAttraction(attraction.attractionId(), attraction.name(), attraction.place(),
                    TripAttractionGroupDTO.valueOf(attraction.attractionGroup().name()), attraction.mustVisit(),
                    AttractionCategoryResponse.from(attraction.category()), attraction.workingHours(),
                    attraction.visitDuration());
        }
    }

    public static GetItineraryResponse from(ItineraryDetails itinerary) {
        var days = itinerary.days().stream().map(day -> new Day(day.id(), day.date())).toList();
        var unscheduled = itinerary.unscheduledAttractions().stream().map(UnscheduledAttraction::from).toList();
        return new GetItineraryResponse(itinerary.tripId(), itinerary.initialZone(), itinerary.lastCheckedAt(), days,
                unscheduled);
    }
}
