package com.triptrove.manager.domain.model;

import java.time.LocalDateTime;

public record SchedulingSummary(Long tripAttractionId, TripAttractionGroup group, LocalDateTime permanentlyClosedAt,
                                String visitDuration) {
}
