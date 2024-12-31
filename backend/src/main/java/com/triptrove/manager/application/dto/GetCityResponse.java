package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.City;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record GetCityResponse(Integer cityId,
                              String cityName,
                              String regionName,
                              String countryName,
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                              LocalDateTime changedOn) {
    public static GetCityResponse from(City city) {
        return new GetCityResponse(city.getId(), city.getName(), city.getRegion().getName(), city.getRegion().getCountry().getName(), city.getUpdatedOn().orElse(city.getCreatedOn()));
    }
}
