package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ScrollPosition;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.AssertTrue;

import java.time.LocalDateTime;

public interface CursorParameter {
    String IDENTIFIER_DESCRIPTION = "The positive identifier of the last raw response item. Supply together with updatedOn, or omit both for the first page.";
    String TIMESTAMP_DESCRIPTION = "The exact changedOn string of the last raw response item. Supply together with its identifier, or omit both for the first page. Preserve all fractional seconds and do not convert the time zone.";

    Number cursorIdentifier();

    LocalDateTime updatedOn();

    @Parameter(hidden = true)
    @AssertTrue(message = "Both the identifier and updatedOn must be provided together")
    default boolean isCursorComplete() {
        return (cursorIdentifier() == null) == (updatedOn() == null);
    }

    default ScrollPosition toScrollPosition() {
        if (cursorIdentifier() == null && updatedOn() == null) {
            return null;
        }
        if (!isCursorComplete()) {
            throw new IllegalArgumentException("A cursor requires both identifier and updatedOn");
        }
        return new ScrollPosition(cursorIdentifier().longValue(), updatedOn());
    }
}
