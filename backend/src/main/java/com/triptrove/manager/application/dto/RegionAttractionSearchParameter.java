package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.CityScrollPosition;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record RegionAttractionSearchParameter(
        @Parameter(description = CursorParameter.IDENTIFIER_DESCRIPTION) @Positive Long attractionId,
        @Parameter(description = CursorParameter.TIMESTAMP_DESCRIPTION)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedOn,
        @Parameter(description = "The exact cityName of the last raw item; omit or use an empty string when it has no city.")
        @Size(max = 256) String cityName) implements CursorParameter {
    @Override
    public Long cursorIdentifier() {
        return attractionId;
    }

    public CityScrollPosition toCityScrollPosition() {
        var position = toScrollPosition();
        if (position == null) {
            return null;
        }
        return new CityScrollPosition(position, cityName);
    }
}
