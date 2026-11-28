package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@JsonAutoDetect(isGetterVisibility = JsonAutoDetect.Visibility.NONE)
@Schema(additionalProperties = Schema.AdditionalPropertiesValue.FALSE)
public record UpdateGroupedAttractionContributionRequest(
        @NotNull @Schema(implementation = Integer.class, minimum = "0", maximum = "2147483647")
        BigDecimal contributionMinutes) implements ItineraryTimingRequest {

    @Schema(hidden = true)
    @AssertTrue(message = "enter a non-negative whole contribution in minutes")
    public boolean isWholeContribution() {
        return contributionMinutes == null || (contributionMinutes.signum() >= 0
                && contributionMinutes.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) <= 0
                && contributionMinutes.stripTrailingZeros().scale() <= 0);
    }
}
