package com.triptrove.manager.domain.model;

import java.util.HashSet;
import java.util.List;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES;

public record ItineraryTransferRemovalSummary(ItineraryTransferSummary transfer, String fromName, String toName) {
    public ItineraryTransferRemovalSummary(long fromEntryId, String fromName, String toName, ItineraryTransfer transfer) {
        this(new ItineraryTransferSummary(fromEntryId, transfer), fromName, toName);
    }

    public static void requireListed(List<ItineraryTransferRemovalSummary> removals,
                                     List<ItineraryTransferSummary> transfersToRemove) {
        var expected = removals.stream().map(ItineraryTransferRemovalSummary::transfer).toList();
        if (expected.size() != transfersToRemove.size() || !new HashSet<>(transfersToRemove).containsAll(expected)) {
            throw new BaseApiException("Listed transfers to remove do not match the change", RESOURCE_HAS_DEPENDENCIES,
                    ItineraryDependency.TRANSFERS_TO_REMOVE, removals.toArray(ItineraryTransferRemovalSummary[]::new));
        }
    }
}
