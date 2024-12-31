package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Region;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record GetRegionResponse(Integer regionId,
                                String regionName,
                                String countryName,
                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                LocalDateTime changedOn) {
    public static GetRegionResponse from(Region region) {
        return new GetRegionResponse(region.getId(), region.getName(), region.getCountry().getName(), region.getCreatedOn());
    }
}
