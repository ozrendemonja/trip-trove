package com.triptrove.manager.domain.model;

import java.time.LocalDate;

public record AttractionVisit(Long attractionId,
                              Long tripId,
                              String tripName,
                              LocalDate tripFromDate,
                              LocalDate tripToDate,
                              Rating rating,
                              String reviewNote) {
}
