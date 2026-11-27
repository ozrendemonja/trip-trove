package com.triptrove.manager.domain.model;

import java.util.List;

public record TypedItineraryEntrySummary(long entryId, ItineraryTypedItem item, boolean fixedStart,
                                        ItineraryTiming timing, ItineraryTransferSummary outgoingTransfer,
                                        List<ItineraryDetails.EntryWarning> warnings) implements ItineraryDetails.EntrySummary {
}
