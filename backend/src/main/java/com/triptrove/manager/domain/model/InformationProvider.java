package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.time.LocalDate;
import java.util.Objects;

@Embeddable
public record InformationProvider(
        @Column(name = "source_name", length = 512, nullable = false)
        String sourceName,
        @Column(name = "source_date", nullable = false)
        LocalDate recorded) {

    public InformationProvider {
        Objects.requireNonNull(sourceName);
        Objects.requireNonNull(recorded);
    }
}
