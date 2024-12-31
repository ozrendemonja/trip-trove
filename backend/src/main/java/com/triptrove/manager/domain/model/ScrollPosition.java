package com.triptrove.manager.domain.model;

import java.time.LocalDateTime;

public record ScrollPosition(int elementId, LocalDateTime updatedOn) {
}
