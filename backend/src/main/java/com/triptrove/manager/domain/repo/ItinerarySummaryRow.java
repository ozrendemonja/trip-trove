package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.ItineraryTransfer;

import java.time.LocalDate;

public record ItinerarySummaryRow(LocalDate tripStart, LocalDate tripEnd, String timeZone, LocalDate itineraryDate,
                                  Long entryId, Long attractionId, String attractionName, Integer position,
                                  Boolean fixedStart, ItineraryTiming timing, ItineraryTransfer outgoingTransfer) {
}
