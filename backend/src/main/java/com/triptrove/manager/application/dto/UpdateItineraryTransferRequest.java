package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.triptrove.manager.domain.model.ItineraryTransfer;
import com.triptrove.manager.domain.model.TransferMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@JsonAutoDetect(isGetterVisibility = JsonAutoDetect.Visibility.NONE)
@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateItineraryTransferRequest(
        @NotNull TransferMode mode,
        @NotNull @Schema(implementation = Integer.class, minimum = "0", maximum = "2147483647") BigDecimal minutes,
        @Size(max = 512) String note) {
    @Schema(hidden = true)
    @AssertTrue(message = "enter non-negative whole transfer minutes")
    public boolean isWholeMinutes() {
        return minutes == null || (minutes.signum() >= 0
                && minutes.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) <= 0
                && minutes.stripTrailingZeros().scale() <= 0);
    }

    public ItineraryTransfer toTransfer(long toEntryId) {
        return new ItineraryTransfer(toEntryId, mode, minutes.intValueExact(), note);
    }
}
