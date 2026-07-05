package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionWithVisitStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetSearchAttractionResponse(Long attractionId,
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
                                          LocalDate infoRecorded,
                                          DateSpanResponse optimalVisitPeriod,
                                          LocalDateTime changedOn,
                                          AttractionVisitStatusResponse visitStatus) {
    public static GetSearchAttractionResponse from(AttractionWithVisitStatus attractionWithVisitStatus) {
        GetAttractionResponse base = GetAttractionResponse.from(attractionWithVisitStatus.attraction());
        return new GetSearchAttractionResponse(
                base.attractionId(),
                base.attractionName(),
                base.cityName(),
                base.regionName(),
                base.countryName(),
                base.isCountrywide(),
                base.mainAttractionName(),
                base.attractionAddress(),
                base.attractionLocation(),
                base.attractionCategory(),
                base.attractionType(),
                base.mustVisit(),
                base.isTraditional(),
                base.tip(),
                base.infoFrom(),
                base.infoRecorded(),
                base.optimalVisitPeriod(),
                base.changedOn(),
                AttractionVisitStatusResponse.from(attractionWithVisitStatus.visitStatus()));
    }
}
