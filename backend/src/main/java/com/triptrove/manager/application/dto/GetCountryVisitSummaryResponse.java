package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.CountryVisitSummary;

public record GetCountryVisitSummaryResponse(
        String countryName,
        String isoCode,
        long visitedMustVisit,
        long unvisitedMustVisit,
        long visitedOther,
        long unvisitedOther
) {
    public static GetCountryVisitSummaryResponse from(CountryVisitSummary summary) {
        return new GetCountryVisitSummaryResponse(
                summary.countryName(),
                summary.isoCode(),
                summary.visitedMustVisit(),
                summary.unvisitedMustVisit(),
                summary.visitedOther(),
                summary.unvisitedOther()
        );
    }
}
