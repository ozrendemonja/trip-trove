package com.triptrove.manager.domain.model;

public record LocationScrollPosition(ScrollPosition position, String regionName, String cityName) {
    public LocationScrollPosition {
        if (position == null || regionName == null || regionName.isBlank()) {
            throw new IllegalArgumentException("A location cursor requires a scroll position and a region name");
        }
        if (cityName == null) {
            cityName = "";
        }
    }
}
