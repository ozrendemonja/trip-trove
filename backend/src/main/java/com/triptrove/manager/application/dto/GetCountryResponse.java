package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Country;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record GetCountryResponse(Integer countryId,
                                 String continentName,
                                 String countryName,
                                 @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                 LocalDateTime changedOn) {
    public static GetCountryResponse from(Country country) {
        return new GetCountryResponse(country.getId(), country.getContinent().getName(), country.getName(), country.getUpdatedOn().orElse(country.getCreatedOn()));
    }
}
