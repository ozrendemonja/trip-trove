package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.ScrollPosition;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record CountryParameter(Integer countryId,
                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedOn) {
    public ScrollPosition toScrollPosition() {
        return new ScrollPosition(countryId, updatedOn);
    }
}
