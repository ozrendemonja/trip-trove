package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionType;

public enum AttractionTypeDTO {
    IMMINENT_CHANGE, POTENTIAL_CHANGE, STABLE;

    public AttractionType toAttractionType() {
        return switch (this) {
            case IMMINENT_CHANGE -> AttractionType.IMMINENT_CHANGE;
            case POTENTIAL_CHANGE -> AttractionType.POTENTIAL_CHANGE;
            case STABLE -> AttractionType.STABLE;
        };
    }
}
