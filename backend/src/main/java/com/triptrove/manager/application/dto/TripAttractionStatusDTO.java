package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.TripAttractionStatus;

public enum TripAttractionStatusDTO {
    PLANNED, VISITED;

    public TripAttractionStatus toStatus() {
        return TripAttractionStatus.valueOf(this.name());
    }
}
