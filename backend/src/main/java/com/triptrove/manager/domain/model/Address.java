package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;

@Embeddable
public record Address(
        @Column(name = "address", length = 512)
        String address,
        @Embedded
        Location location) {
}
