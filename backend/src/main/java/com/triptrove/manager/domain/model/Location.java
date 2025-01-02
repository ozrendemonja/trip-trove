package com.triptrove.manager.domain.model;

public record Location(Double latitude, Double longitude) {
    public Location {
        if (latitude > 90.0 || latitude < -90.0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90 degrees");
        }
        if (longitude > 180.0 || longitude < -180.0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180 degrees");
        }
    }
}
