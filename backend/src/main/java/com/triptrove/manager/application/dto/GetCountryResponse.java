package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Country;

import java.time.LocalDateTime;

public record GetCountryResponse(Integer countryId,
                                 String continentName,
                                 String countryName,
                                 LocalDateTime changedOn) {
    public static GetCountryResponse from(Country country) {
        return new GetCountryResponse(country.getId(), country.getContinent().getName(), country.getName(), country.getUpdatedOn().orElse(country.getCreatedOn()));
    }
}
