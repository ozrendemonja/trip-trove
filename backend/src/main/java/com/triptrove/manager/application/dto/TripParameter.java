package com.triptrove.manager.application.dto;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record TripParameter(@Parameter(description = CursorParameter.IDENTIFIER_DESCRIPTION) @Positive Long tripId,
                            @Parameter(description = CursorParameter.TIMESTAMP_DESCRIPTION)
                            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedOn)
        implements CursorParameter {
    @Override
    public Long cursorIdentifier() {
        return tripId;
    }
}