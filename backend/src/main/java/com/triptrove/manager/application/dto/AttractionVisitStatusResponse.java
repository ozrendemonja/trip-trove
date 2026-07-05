package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionVisitStatus;

public enum AttractionVisitStatusResponse {
    NOT_VISITED,
    VISITED_WANT_RETURN,
    VISITED_DONE;

    public static AttractionVisitStatusResponse from(AttractionVisitStatus status) {
        return switch (status) {
            case NOT_VISITED -> NOT_VISITED;
            case VISITED_WANT_RETURN -> VISITED_WANT_RETURN;
            case VISITED_DONE -> VISITED_DONE;
        };
    }
}
