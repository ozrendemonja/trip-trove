package com.triptrove.manager.domain.model;

import java.time.LocalDateTime;

public record ScrollPosition(long elementId, LocalDateTime updatedOn) {
    public ScrollPosition {
        if (elementId <= 0 || updatedOn == null) {
            throw new IllegalArgumentException("A scroll position requires a positive identifier and a timestamp");
        }
    }
}
