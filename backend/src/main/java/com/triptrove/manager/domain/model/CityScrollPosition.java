package com.triptrove.manager.domain.model;

public record CityScrollPosition(ScrollPosition position, String cityName) {
    public CityScrollPosition {
        if (position == null) {
            throw new IllegalArgumentException("A city cursor requires a scroll position");
        }
        if (cityName == null) {
            cityName = "";
        }
    }
}
