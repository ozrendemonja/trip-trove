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
        String timeZone,
        @Schema(description = "Absent until the itinerary has been manually checked.") Instant lastCheckedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<Day> days,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED,
                description = "Eligible, unscheduled attractions in board column, place and card order.")
        List<UnscheduledAttraction> unscheduledAttractions) {
    public record Day(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate date,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED,
                    description = "Entries are returned in visit order, even when start times match.")
            List<AttractionEntry> entries) {
        private static Day from(ItineraryDetails.Day day) {
            return new Day(day.id(), day.date(), day.entries().stream().map(AttractionEntry::from).toList());
        }
    }

    public record AttractionEntry(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long entryId,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long attractionId,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) TripAttractionGroupDTO attractionGroup,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean mustVisit,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) AttractionCategoryResponse category,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean fixedStart,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ItineraryTimingResponse timing) {
        private static AttractionEntry from(ItineraryDetails.AttractionEntrySummary entry) {
            return new AttractionEntry(entry.entryId(), entry.attractionId(), entry.name(),
                    TripAttractionGroupDTO.valueOf(entry.attractionGroup().name()), entry.mustVisit(),
                    AttractionCategoryResponse.from(entry.category()), entry.fixedStart(),
                    ItineraryTimingResponse.from(entry.timing()));
        }
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
        var days = itinerary.days().stream().map(Day::from).toList();
        var unscheduled = itinerary.unscheduledAttractions().stream().map(UnscheduledAttraction::from).toList();
        return new GetItineraryResponse(itinerary.tripId(), itinerary.timeZone(), itinerary.lastCheckedAt(), days,
                unscheduled);
    }
}
