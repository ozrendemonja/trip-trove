package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Address;
import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.City;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetAttractionResponse(Long attractionId,
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
                                    boolean mustVisit,
                                    boolean isTraditional,
                                    String tip,
                                    String infoFrom,
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                    LocalDate infoRecorded,
                                    DateSpanResponse optimalVisitPeriod,
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                    LocalDateTime changedOn) {
    public static GetAttractionResponse from(Attraction attraction) {
        return new GetAttractionResponse(
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
                attraction.isMustVisit(),
                attraction.isTraditional(),
                attraction.getTip().orElse(null),
                attraction.getInformationProvider().sourceName(),
                attraction.getInformationProvider().recorded(),
                attraction.getOptimalVisitPeriod().map(visitPeriod -> new DateSpanResponse(visitPeriod.from(), visitPeriod.to())).orElse(null),
                attraction.getCreatedOn()
        );
    }
}
