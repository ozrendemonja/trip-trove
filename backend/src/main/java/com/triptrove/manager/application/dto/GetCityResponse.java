package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.CitySummary;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record GetCityResponse(Integer cityId,
                              String cityName,
                              String regionName,
                              String countryName,
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                              LocalDateTime changedOn) {
    public static GetCityResponse from(CitySummary city) {
        return new GetCityResponse(city.id(), city.name(), city.regionName(), city.countryName(), city.changedOn());
    }
}
