package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ItineraryItemToAdd(LocalDate date, Long afterEntryId, LocalTime start, String timeZone,
                                ItineraryTypedItem item, int plannedMinutes, boolean fixedStart,
                                List<ItineraryTransferSummary> transfersToRemoveAtInsertionPoint) {
}
