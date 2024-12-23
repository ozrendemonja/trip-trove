package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.CountryScrollPosition;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record CountryParameter(Integer countryId,
                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedOn) {
    public CountryScrollPosition toCountryScrollPosition() {
        return new CountryScrollPosition(countryId, updatedOn);
    }
}
