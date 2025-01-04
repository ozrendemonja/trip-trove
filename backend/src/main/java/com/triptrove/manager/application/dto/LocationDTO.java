package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Location;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Range;

public record LocationDTO(
        @NotNull
        @Range(min = -90, max = 90, message = "Latitude must be between {min} and {max} to be valid")
        Double latitude,
        @NotNull
        @Range(min = -180, max = 180, message = "Longitude must be between {min} and {max} to be valid")
        Double longitude) {

    public Location toLocation() {
        return new Location(latitude, longitude);
    }
}
