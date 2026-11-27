package com.triptrove.manager.domain.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public record ItineraryRemovalSummary(ItineraryEntry entry, String subject, Instant lastCheckedAt,
                                      ItineraryEntry incomingTransferFromEntry, String incomingTransferFrom, String outgoingTransferTo) {
    public List<ItineraryTransferRemovalSummary> transferRemovals() {
        var removals = new ArrayList<ItineraryTransferRemovalSummary>(2);
        if (incomingTransferFromEntry != null) {
            removals.add(new ItineraryTransferRemovalSummary(incomingTransferFromEntry.getId(),
                    incomingTransferFrom, subject, incomingTransferFromEntry.getOutgoingTransfer()));
        }
        if (entry.getOutgoingTransfer() != null) {
            removals.add(new ItineraryTransferRemovalSummary(entry.getId(), subject, outgoingTransferTo,
                    entry.getOutgoingTransfer()));
        }
        return List.copyOf(removals);
    }
}
