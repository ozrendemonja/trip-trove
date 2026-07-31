package com.triptrove.manager.domain.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AttractionTest {
    @Test
    void shouldSetPermanentClosureTimestampWhenMarkedPermanentlyClosed() {
        var attraction = new Attraction();

        attraction.markPermanentlyClosed();

        assertThat(attraction.getPermanentlyClosedAt()).isNotNull();
    }

    @Test
    void shouldKeepOriginalTimestampWhenMarkedPermanentlyClosedAgain() {
        var attraction = new Attraction();
        attraction.markPermanentlyClosed();
        var originalTimestamp = attraction.getPermanentlyClosedAt();

        attraction.markPermanentlyClosed();

        assertThat(attraction.getPermanentlyClosedAt()).isEqualTo(originalTimestamp);
    }

    @Test
    void shouldClearPermanentClosureTimestampWhenReopened() {
        var attraction = new Attraction();
        attraction.markPermanentlyClosed();

        attraction.reopen();

        assertThat(attraction.getPermanentlyClosedAt()).isNull();
    }
}