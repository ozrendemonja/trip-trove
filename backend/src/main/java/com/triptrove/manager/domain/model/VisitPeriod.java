package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;

import java.time.LocalDate;

public record VisitPeriod(
        @Column(name = "visit_period_from")
        LocalDate from,
        @Column(name = "visit_period_to")
        LocalDate to) {
}
