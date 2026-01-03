package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.CountriesSummary;

public record GetCountriesSummaryResponse(int visitedCount, int totalCount) {
    public static GetCountriesSummaryResponse from(CountriesSummary countriesSummary) {
        return new GetCountriesSummaryResponse(countriesSummary.visited(), countriesSummary.total());
    }
}
