package com.triptrove.manager.application.dto.error;

import com.triptrove.manager.domain.model.BaseApiException;

public enum ErrorCodeResponse {
    NAME_CONFLICT, ISO_CODE_CONFLICT, RESOURCE_HAS_DEPENDENCIES, ATTRACTION_ALREADY_ADDED_TO_TRIP, OBJECT_NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR;

    public static ErrorCodeResponse from(BaseApiException.ErrorCode errorCode) {
        return switch (errorCode) {
            case RESOURCE_NOT_FOUND -> OBJECT_NOT_FOUND;
            case NAME_ALREADY_EXISTS -> NAME_CONFLICT;
            case RESOURCE_HAS_DEPENDENCIES -> RESOURCE_HAS_DEPENDENCIES;
            case COUNTRY_ISO_CODE_ALREADY_EXISTS -> ISO_CODE_CONFLICT;
            case TRIP_ALREADY_CONTAINS_ATTRACTION -> ATTRACTION_ALREADY_ADDED_TO_TRIP;
            case ATTRACTION_OUTSIDE_MAIN_ATTRACTION_CONTINENT,
                 BUCKET_LIST_ITEM_COMPLETION_OUTSIDE_TRIP_DATES,
                 INVALID_TRIP_BOARD -> BAD_REQUEST;
            case null -> BAD_REQUEST;
        };
    }
}
