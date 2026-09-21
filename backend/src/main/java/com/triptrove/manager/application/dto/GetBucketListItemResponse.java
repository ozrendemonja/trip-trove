package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.BucketListItemDetails;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetBucketListItemResponse(
        Long id,
        String name,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate completedOn,
        Boolean wouldRepeat,
        Integer cityId,
        String cityName,
        Integer regionId,
        String regionName,
        String description,
        Long tripId,
        String tripName,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        LocalDateTime changedOn) {

    public static GetBucketListItemResponse from(BucketListItemDetails item) {
        return new GetBucketListItemResponse(item.id(), item.name(), item.completedOn(), item.wouldRepeat(),
                item.cityId(), item.cityName(), item.regionId(), item.regionName(), item.description(),
                item.tripId(), item.tripName(), item.changedOn());
    }
}