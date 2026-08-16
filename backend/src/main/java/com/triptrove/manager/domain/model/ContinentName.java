package com.triptrove.manager.domain.model;

import java.util.Objects;

public record ContinentName(String value) {
    public ContinentName {
        Objects.requireNonNull(value, "Continent name cannot be null");
    }

    @Override
    public String toString() {
        return value;
    }
}