package com.triptrove.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;

interface ItineraryTimingRequest {
    // Do not silently accept a second timing edit on a single-field PUT.
    @JsonAnySetter
    default void rejectUnknownField(String field, Object value) {
        throw new IllegalArgumentException("Unexpected timing field: " + field);
    }
}
