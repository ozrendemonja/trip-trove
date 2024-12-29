package com.triptrove.manager.application.dto.error;

import com.triptrove.manager.domain.model.BaseApiException;

public enum ErrorCodeResponse {
    NAME_CONFLICT, OBJECT_NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR;

    public static ErrorCodeResponse from(BaseApiException.ErrorCode errorCode) {
        return switch (errorCode) {
            case GENERAL -> INTERNAL_SERVER_ERROR;
            case DUPLICATE_NAME -> NAME_CONFLICT;
            case OBJECT_NOT_FOUND -> OBJECT_NOT_FOUND;
            case null -> BAD_REQUEST;
        };
    }
}
