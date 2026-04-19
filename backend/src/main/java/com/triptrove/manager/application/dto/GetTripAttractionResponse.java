package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Address;
import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.TripAttraction;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record GetTripAttractionResponse(Long attractionId,
                                        String attractionName,
                                        String cityName,
                                        String regionName,
                                        String countryName,
                                        boolean isCountrywide,
                                        String mainAttractionName,
                                        String attractionAddress,
                                        LocationResponse attractionLocation,
                                        AttractionCategoryResponse attractionCategory,
                                        AttractionTypeResponse attractionType,
                                        boolean isTraditional,
                                        String tip,
                                        String infoFrom,
                                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                        LocalDate infoRecorded,
                                        DateSpanResponse optimalVisitPeriod,
                                        TripAttractionStatusDTO status,
                                        RatingDTO rating,
                                        String note,
                                        String reviewNote,
                                        TripAttractionGroupDTO attractionGroup,
                                        boolean mustVisit,
                                        String workingHours,
                                        String visitTime) {
    public static GetTripAttractionResponse from(TripAttraction tripAttraction) {
        Attraction attraction = tripAttraction.getAttraction();
        return new GetTripAttractionResponse(
                attraction.getId(),
                attraction.getName(),
                attraction.getCity().map(City::getName).orElse(null),
                attraction.getRegion().getName(),
                attraction.getCountry().getName(),
                attraction.isCountrywide(),
                attraction.getMain().map(Attraction::getName).orElse(null),
                attraction.getAddress().map(Address::address).orElse(null),
                attraction.getAddress().map(Address::location).map(location -> new LocationResponse(location.latitude(), location.longitude())).orElse(null),
                AttractionCategoryResponse.from(attraction.getCategory()),
                AttractionTypeResponse.from(attraction.getType()),
                attraction.isTraditional(),
                attraction.getTip().orElse(null),
                attraction.getInformationProvider().sourceName(),
                attraction.getInformationProvider().recorded(),
                attraction.getOptimalVisitPeriod().map(visitPeriod -> new DateSpanResponse(visitPeriod.from(), visitPeriod.to())).orElse(null),
                TripAttractionStatusDTO.valueOf(tripAttraction.getStatus().name()),
                tripAttraction.getRating() != null ? RatingDTO.valueOf(tripAttraction.getRating().name()) : null,
                tripAttraction.getNote(),
                tripAttraction.getReviewNote(),
                TripAttractionGroupDTO.valueOf(tripAttraction.getAttractionGroup().name()),
                tripAttraction.isMustVisit(),
                tripAttraction.getWorkingHours(),
                tripAttraction.getVisitTime()
        );
    }
}
