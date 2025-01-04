package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.util.Objects;

public record InformationProvider(
        String sourceName,
        LocalDate recorded) {
    public InformationProvider {
        Objects.requireNonNull(sourceName);
        Objects.requireNonNull(recorded);
    }
}
