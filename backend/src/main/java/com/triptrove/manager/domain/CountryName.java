package com.triptrove.manager.domain;

import java.util.Objects;

public record CountryName(String name) {
    public CountryName {
        Objects.requireNonNull(name, "Country name cannot be null");
    }
}