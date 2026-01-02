package com.triptrove.manager.application.dto.error;

import com.triptrove.manager.domain.model.BaseApiException;

public enum ErrorCodeResponse {
    NAME_CONFLICT, CASCADE_DELETE_ERROR, ATTRACTION_ALREADY_ADDED_TO_TRIP, OBJECT_NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR;

    public static ErrorCodeResponse from(BaseApiException.ErrorCode errorCode) {
        return switch (errorCode) {
            case GENERAL -> INTERNAL_SERVER_ERROR;
            case DUPLICATE_NAME -> NAME_CONFLICT;
            case HAS_CHILDREN -> CASCADE_DELETE_ERROR;
            case ATTRACTION_ALREADY_ADDED_TO_TRIP -> ATTRACTION_ALREADY_ADDED_TO_TRIP;
            case OBJECT_NOT_FOUND -> OBJECT_NOT_FOUND;
            case CONSTRAINT_VIOLATION -> BAD_REQUEST;
            case null -> BAD_REQUEST;
        };
    }
}
