package com.triptrove.manager.domain.model;

public record CountryVisitSummary(
        String countryName,
        String isoCode,
        long visitedMustVisit,
        long unvisitedMustVisit,
        long visitedOther,
        long unvisitedOther
) {
    public CountryVisitSummary {
        requireNonNegative("visitedMustVisit", visitedMustVisit);
        requireNonNegative("unvisitedMustVisit", unvisitedMustVisit);
        requireNonNegative("visitedOther", visitedOther);
        requireNonNegative("unvisitedOther", unvisitedOther);
    }

    private static void requireNonNegative(String fieldName, long value) {
        if (value < 0) {
            throw new IllegalArgumentException(
                    fieldName + " cannot be negative, but was " + value
            );
        }
    }
}
