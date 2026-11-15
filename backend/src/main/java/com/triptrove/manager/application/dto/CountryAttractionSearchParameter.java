package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.LocationScrollPosition;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record CountryAttractionSearchParameter(
        @Parameter(description = CursorParameter.IDENTIFIER_DESCRIPTION) @Positive Long attractionId,
        @Parameter(description = CursorParameter.TIMESTAMP_DESCRIPTION)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedOn,
        @Parameter(description = "The exact regionName of the last raw item; required for a country-search continuation.")
        @Size(max = 256) String regionName,
        @Parameter(description = "The exact cityName of the last raw item; omit or use an empty string when it has no city.")
        @Size(max = 256) String cityName) implements CursorParameter {
    @Override
    public Long cursorIdentifier() {
        return attractionId;
    }

    @Parameter(hidden = true)
    @AssertTrue(message = "A grouped cursor requires the region name of the last item")
    public boolean isLocationCursorComplete() {
        return attractionId == null || updatedOn == null || (regionName != null && !regionName.isBlank());
    }

    public LocationScrollPosition toLocationScrollPosition() {
        var position = toScrollPosition();
        if (position == null) {
            return null;
        }
        return new LocationScrollPosition(position, regionName, cityName);
    }
}
