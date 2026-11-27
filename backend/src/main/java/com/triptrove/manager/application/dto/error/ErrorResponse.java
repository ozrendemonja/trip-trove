package com.triptrove.manager.application.dto.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.triptrove.manager.application.dto.ItineraryTransferRemovalResponse;
import com.triptrove.manager.domain.model.AttractionToSchedule.MissingInputs;
import com.triptrove.manager.domain.model.ItineraryMoveStartChoices;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public record ErrorResponse(ErrorCodeResponse errorCode, String errorMessage,
                            @JsonInclude(JsonInclude.Include.NON_NULL)
                            @Schema(description = "Inputs needed to schedule an attraction, when applicable.")
                            MissingInputs schedulingInputs,
                            @JsonInclude(JsonInclude.Include.NON_NULL)
                            @Schema(description = "UTC offsets that both fit a position when a moved entry's clock repeats.")
                            ItineraryMoveStartChoices moveStartChoices,
                            @JsonInclude(JsonInclude.Include.NON_NULL)
                            @Schema(description = "Current transfers the requested action would disconnect.")
                            List<ItineraryTransferRemovalResponse> transfersToRemove) {
    public ErrorResponse(ErrorCodeResponse errorCode, String errorMessage) {
        this(errorCode, errorMessage, null, null, null);
    }
}
