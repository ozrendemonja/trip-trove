package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

// The Bean Validation getter is not a request field.
@JsonAutoDetect(isGetterVisibility = JsonAutoDetect.Visibility.NONE)
@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateItineraryEntryPlannedLengthRequest(
        @NotNull @Schema(implementation = Integer.class, minimum = "0", maximum = "2147483647")
        BigDecimal plannedMinutes) implements ItineraryTimingRequest {

    @Schema(hidden = true)
    @AssertTrue(message = "enter a non-negative whole length in minutes")
    public boolean isWholePlannedLength() {
        return plannedMinutes == null || (plannedMinutes.signum() >= 0
                && plannedMinutes.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) <= 0
                && plannedMinutes.stripTrailingZeros().scale() <= 0);
    }
}
