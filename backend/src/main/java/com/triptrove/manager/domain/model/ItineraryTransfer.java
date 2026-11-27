package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.util.Objects;

@Embeddable
public record ItineraryTransfer(
        @Column(name = "transfer_to_entry_id") Long toEntryId,
        @Column(name = "transfer_mode") @Enumerated(EnumType.STRING) TransferMode mode,
        @Column(name = "transfer_minutes") Integer minutes,
        @Column(name = "transfer_note", length = 512) String note) {
    public ItineraryTransfer {
        if (toEntryId == null || toEntryId <= 0 || mode == null || minutes == null || minutes < 0) {
            throw new IllegalArgumentException("Transfer requires a destination, mode and non-negative whole minutes");
        }
        if (note != null && note.length() > 512) {
            throw new IllegalArgumentException("Transfer note exceeds 512 characters");
        }
        if (note != null && note.isEmpty()) {
            note = null;
        }
    }

    public static ItineraryTransfer between(ItineraryTransfer transfer, long toEntryId) {
        return transfer != null && Objects.equals(transfer.toEntryId(), toEntryId) ? transfer : null;
    }
}
