package com.triptrove.manager.application.dto.search;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.triptrove.manager.domain.model.SearchInElement;

public enum SearchIn {
    COUNTRY("country"),
    CONTINENT("continent"),
    REGION("region"),
    CITY("city"),
    ATTRACTION("ATTRACTION");
    private final String value;

    SearchIn(String in) {
        this.value = in;
    }

    @JsonCreator
    public static SearchIn fromString(String value) {
        return SearchIn.valueOf(value.toUpperCase());
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public SearchInElement toSearchInElement() {
        return switch (this) {
            case COUNTRY -> SearchInElement.COUNTRY;
            case CONTINENT -> SearchInElement.CONTINENT;
            case REGION -> SearchInElement.REGION;
            case CITY -> SearchInElement.CITY;
            case ATTRACTION -> SearchInElement.ATTRACTION;
        };
    }
}
