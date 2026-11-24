package com.triptrove.manager.domain.model;

import java.time.Instant;

public record ItineraryRemovalSummary(ItineraryEntry entry, String subject, Instant lastCheckedAt) {
}
