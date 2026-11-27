package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ItineraryItemKind;
import com.triptrove.manager.domain.model.ItineraryItemToAdd;
import com.triptrove.manager.domain.model.ItineraryTypedItem;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AddItineraryItemRequest(
        @NotNull LocalDate date,
        @Schema(description = "Insert after this entry on the selected day. Omit only on an empty day.")
        @Positive Long afterEntryId,
        @Schema(description = "Local start clock when the selected day is empty.", example = "09:00")
        @Pattern(regexp = ScheduleAttractionRequest.LOCAL_CLOCK_PATTERN) String startTime,
        @Size(max = 255) String timeZone,
        @NotNull ItineraryItemKind kind,
        @NotNull @Valid ItineraryItemFields item,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemoveAtInsertionPoint) {
    public ItineraryItemToAdd toItemToAdd() {
        return new ItineraryItemToAdd(date, afterEntryId, startTime == null ? null : LocalTime.parse(startTime), timeZone,
                new ItineraryTypedItem(kind, item.name(), item.note()), item.plannedMinutes().intValueExact(), item.fixedStart(),
                ItineraryTransferDTO.toSummaries(transfersToRemoveAtInsertionPoint));
    }
}
