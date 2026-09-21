package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.CountrySummary;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record GetCountryResponse(Integer countryId,
                                 String continentName,
                                 String countryName,
                                 String isoCode,
                                 @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                 LocalDateTime changedOn) {
    public static GetCountryResponse from(CountrySummary country) {
        return new GetCountryResponse(country.id(), country.continentName(), country.name(), country.isoCode(), country.changedOn());
    }
}
