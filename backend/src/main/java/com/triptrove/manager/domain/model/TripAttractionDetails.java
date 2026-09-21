package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TripAttractionDetails(Long attractionId, String attractionName, String cityName, String regionName,
                                    String countryName, boolean isCountrywide, String mainAttractionName,
                                    Address address, AttractionCategory category, AttractionType type,
                                    boolean isTraditional, String tip, String informationProviderName,
                                    LocalDate recorded, VisitPeriod optimalVisitPeriod,
                                    LocalDateTime permanentlyClosedAt, TripAttractionStatus status, Rating rating,
                                    String note, String reviewNote, TripAttractionGroup attractionGroup,
                                    boolean mustVisit, String workingHours, String visitTime, boolean wouldVisitAgain) {
}