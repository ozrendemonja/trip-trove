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
        INVALID_TRIP_BOARD,
        ITINERARY_INPUT_REQUIRED,
        ITINERARY_MOVE_START_CHOICE_REQUIRED,
        ITINERARY_START_OFFSET_NOT_AVAILABLE,
        ITINERARY_ATTRACTION_INELIGIBLE,
        ITINERARY_ATTRACTION_ALREADY_SCHEDULED,
        ITINERARY_GROUP_JOIN_NOT_ALLOWED,
        ITINERARY_DURATION_ALREADY_VALID,
        ITINERARY_UNKNOWN_ZONE,
        ITINERARY_CLOCK_GAP,
        ITINERARY_DAY_NOT_IN_TRIP,
        ITINERARY_END_OUTSIDE_TRIP,
        ITINERARY_ENTRY_OVERLAP,
        ITINERARY_START_DATE_CHANGE,
        ITINERARY_INVALID_END_CLOCK,
        ITINERARY_PLANNED_LENGTH_NOT_ALLOWED,
        ITINERARY_CHECK_STALE
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