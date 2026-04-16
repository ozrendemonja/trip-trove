package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.TripAttractionGroup;

public enum TripAttractionGroupDTO {
    PRIMARY, SECONDARY, EXCLUDED;

    public TripAttractionGroup toGroup() {
        return TripAttractionGroup.valueOf(this.name());
    }
}
