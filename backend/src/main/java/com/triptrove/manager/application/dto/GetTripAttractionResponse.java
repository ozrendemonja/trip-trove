package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Address;
import com.triptrove.manager.domain.model.TripAttractionDetails;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

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
                                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                        LocalDateTime permanentlyClosedAt,
                                        TripAttractionStatusDTO status,
                                        RatingDTO rating,
                                        String note,
                                        String reviewNote,
                                        TripAttractionGroupDTO attractionGroup,
                                        boolean mustVisit,
                                        String workingHours,
                                        String visitTime,
                                        boolean wouldVisitAgain) {
    public static GetTripAttractionResponse from(TripAttractionDetails attraction) {
        return new GetTripAttractionResponse(
                attraction.attractionId(),
                attraction.attractionName(),
                attraction.cityName(),
                attraction.regionName(),
                attraction.countryName(),
                attraction.isCountrywide(),
                attraction.mainAttractionName(),
                Optional.ofNullable(attraction.address()).map(Address::address).orElse(null),
                Optional.ofNullable(attraction.address()).map(Address::location).map(location -> new LocationResponse(location.latitude(), location.longitude())).orElse(null),
                AttractionCategoryResponse.from(attraction.category()),
                AttractionTypeResponse.from(attraction.type()),
                attraction.isTraditional(),
                attraction.tip(),
                attraction.informationProviderName(),
                attraction.recorded(),
                Optional.ofNullable(attraction.optimalVisitPeriod()).map(visitPeriod -> new DateSpanResponse(visitPeriod.from(), visitPeriod.to())).orElse(null),
                attraction.permanentlyClosedAt(),
                TripAttractionStatusDTO.valueOf(attraction.status().name()),
                Optional.ofNullable(attraction.rating()).map(rating -> RatingDTO.valueOf(rating.name())).orElse(null),
                attraction.note(),
                attraction.reviewNote(),
                TripAttractionGroupDTO.valueOf(attraction.attractionGroup().name()),
                attraction.mustVisit(),
                attraction.workingHours(),
                attraction.visitTime(),
                attraction.wouldVisitAgain()
        );
    }
}
