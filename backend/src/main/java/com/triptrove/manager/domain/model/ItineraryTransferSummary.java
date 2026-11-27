package com.triptrove.manager.domain.model;

public record ItineraryTransferSummary(long fromEntryId, long toEntryId, TransferMode mode, int minutes,
                                      String note) {
    public ItineraryTransferSummary(long fromEntryId, ItineraryTransfer transfer) {
        this(fromEntryId, transfer.toEntryId(), transfer.mode(), transfer.minutes(), transfer.note());
    }
}
