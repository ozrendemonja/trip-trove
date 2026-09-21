package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Address;
import com.triptrove.manager.domain.model.AttractionDetails;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

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
                                    LocalDateTime permanentlyClosedAt,
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                    LocalDateTime changedOn) {
    public static GetAttractionResponse from(AttractionDetails attraction) {
        return new GetAttractionResponse(
                attraction.id(),
                attraction.name(),
                attraction.cityName(),
                attraction.regionName(),
                attraction.countryName(),
                attraction.isCountrywide(),
                attraction.mainAttractionName(),
                Optional.ofNullable(attraction.address()).map(Address::address).orElse(null),
                Optional.ofNullable(attraction.address()).map(Address::location).map(location -> new LocationResponse(location.latitude(), location.longitude())).orElse(null),
                AttractionCategoryResponse.from(attraction.category()),
                AttractionTypeResponse.from(attraction.type()),
                attraction.mustVisit(),
                attraction.isTraditional(),
                attraction.tip(),
                attraction.informationProviderName(),
                attraction.recorded(),
                Optional.ofNullable(attraction.optimalVisitPeriod()).map(visitPeriod -> new DateSpanResponse(visitPeriod.from(), visitPeriod.to())).orElse(null),
                attraction.permanentlyClosedAt(),
                attraction.changedOn()
        );
    }
}
