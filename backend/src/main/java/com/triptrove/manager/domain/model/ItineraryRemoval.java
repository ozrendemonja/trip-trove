package com.triptrove.manager.domain.model;

import java.util.List;

public record ItineraryRemoval(long entryId, List<ItineraryTransferSummary> transfersToRemove,
                              List<Long> groupedAttractionIdsToRemove) {
}
