package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionType;

public enum AttractionTypeResponse {
    IMMINENT_CHANGE, POTENTIAL_CHANGE, STABLE;

    public static AttractionTypeResponse from(AttractionType attractionType) {
        return switch (attractionType) {
            case IMMINENT_CHANGE -> AttractionTypeResponse.IMMINENT_CHANGE;
            case POTENTIAL_CHANGE -> AttractionTypeResponse.POTENTIAL_CHANGE;
            case STABLE -> AttractionTypeResponse.STABLE;
        };
    }
}
