package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.triptrove.manager.domain.model.ItineraryTransferSummary;
import com.triptrove.manager.domain.model.TransferMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ItineraryTransferDTO(
        @NotNull @Positive Long fromEntryId,
        @NotNull @Positive Long toEntryId,
        @NotNull TransferMode mode,
        @NotNull @PositiveOrZero Integer minutes,
        @Size(max = 512) String note) {
    public static ItineraryTransferDTO from(ItineraryTransferSummary transfer) {
        return new ItineraryTransferDTO(transfer.fromEntryId(), transfer.toEntryId(),
                transfer.mode(), transfer.minutes(), transfer.note());
    }

    public static List<ItineraryTransferSummary> toSummaries(List<ItineraryTransferDTO> transfers) {
        return transfers == null ? List.of() : transfers.stream()
                .map(transfer -> new ItineraryTransferSummary(transfer.fromEntryId(), transfer.toEntryId(),
                        transfer.mode(), transfer.minutes(), transfer.note()))
                .toList();
    }
}
