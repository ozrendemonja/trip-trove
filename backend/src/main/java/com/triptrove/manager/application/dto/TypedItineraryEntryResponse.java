package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.triptrove.manager.domain.model.ItineraryDetails;
import com.triptrove.manager.domain.model.ItineraryItemKind;
import com.triptrove.manager.domain.model.TypedItineraryEntrySummary;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TypedItineraryEntryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long entryId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ItineraryItemKind kind,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean fixedStart,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ItineraryTimingResponse timing,
        @Schema(description = "Plain-text note owned by this entry, if recorded.") String note,
        @Schema(description = "Entered transfer to the immediately following entry, if any.") ItineraryTransferDTO outgoingTransfer,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<ItineraryDetails.EntryWarning> warnings)
        implements GetItineraryResponse.Entry {
    static TypedItineraryEntryResponse from(TypedItineraryEntrySummary entry) {
        return new TypedItineraryEntryResponse(entry.entryId(), entry.item().kind(), entry.item().name(), entry.fixedStart(),
                ItineraryTimingResponse.from(entry.timing()), entry.item().note(),
                entry.outgoingTransfer() == null ? null : ItineraryTransferDTO.from(entry.outgoingTransfer()), entry.warnings());
    }
}
