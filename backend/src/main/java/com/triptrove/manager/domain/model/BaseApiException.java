package com.triptrove.manager.domain.model;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;

@Getter
public class BaseApiException extends RuntimeException {
    public enum ErrorCode {
        RESOURCE_NOT_FOUND,
        NAME_ALREADY_EXISTS,
        RESOURCE_HAS_DEPENDENCIES,
        COUNTRY_ISO_CODE_ALREADY_EXISTS,
        ATTRACTION_OUTSIDE_MAIN_ATTRACTION_CONTINENT,
        TRIP_ALREADY_CONTAINS_ATTRACTION,
        BUCKET_LIST_ITEM_COMPLETION_OUTSIDE_TRIP_DATES,
        INVALID_TRIP_BOARD
    }

    private final ErrorCode errorCode;
    private final List<Object> context;

    public BaseApiException(ErrorCode errorCode, Object... context) {
        this("Domain error", errorCode, context);
    }

    public BaseApiException(String diagnosticMessage, ErrorCode errorCode, Object... context) {
        super("%s: code=%s, context=%s".formatted(diagnosticMessage, errorCode, Arrays.toString(context)));
        this.errorCode = errorCode;
        this.context = List.of(context);
    }
}