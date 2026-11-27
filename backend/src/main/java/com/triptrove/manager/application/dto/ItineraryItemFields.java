package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@JsonAutoDetect(isGetterVisibility = JsonAutoDetect.Visibility.NONE)
public record ItineraryItemFields(
        @NotBlank @Size(max = 255) String name,
        @NotNull @Schema(implementation = Integer.class, minimum = "1", maximum = "2147483647") BigDecimal plannedMinutes,
        boolean fixedStart,
        @Size(max = 512) String note) {
    @Schema(hidden = true)
    @AssertTrue(message = "enter positive whole planned minutes")
    public boolean isWholeMinutes() {
        return plannedMinutes == null || (plannedMinutes.signum() > 0
                && plannedMinutes.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) <= 0
                && plannedMinutes.stripTrailingZeros().scale() <= 0);
    }
}
