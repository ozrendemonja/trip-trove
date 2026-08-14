package com.triptrove.manager.domain;

import java.util.Objects;

public record ContinentName(String name) {
    public ContinentName {
        Objects.requireNonNull(name, "Continent name cannot be null");
    }
}