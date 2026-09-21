package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttractionDetails(Long id, String name, String cityName, String regionName, String countryName,
                                boolean isCountrywide, String mainAttractionName, Address address,
                                AttractionCategory category, AttractionType type, boolean mustVisit,
                                boolean isTraditional, String tip, String informationProviderName, LocalDate recorded,
                                VisitPeriod optimalVisitPeriod, LocalDateTime permanentlyClosedAt,
                                LocalDateTime changedOn) {
}