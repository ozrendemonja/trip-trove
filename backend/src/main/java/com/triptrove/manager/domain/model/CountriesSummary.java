package com.triptrove.manager.domain.model;

public record CountriesSummary(int visited, int total) {
    public CountriesSummary {
        if (visited < 0) {
            throw new IllegalArgumentException("visited cannot be less than zero");
        }
        if (total < 0) {
            throw new IllegalArgumentException("total cannot be less than zero");
        }
    }
}
