package com.triptrove.manager.domain.model;

public record AttractionFilter(Boolean isCountrywide,
                               AttractionCategory category,
                               AttractionType type,
                               Boolean mustVisit,
                               Boolean isTraditional,
                               String query) {
}
