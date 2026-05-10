package com.triptrove.manager.domain.model;

public record CountryAttractionCount(
        String countryName,
        String isoCode,
        boolean mustVisitAttraction,
        long attractionCount
) {
}
