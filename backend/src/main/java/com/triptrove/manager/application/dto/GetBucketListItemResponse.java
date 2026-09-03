package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.BucketListItem;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.Trip;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GetBucketListItemResponse(
        Long id,
        String name,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate completedOn,
        Integer cityId,
        String cityName,
        Integer regionId,
        String regionName,
        String description,
        Long tripId,
        String tripName,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        LocalDateTime changedOn) {

    public static GetBucketListItemResponse from(BucketListItem item) {
        City city = item.getCity().orElse(null);
        Region region = item.getRegion().orElse(null);
        Trip trip = item.getTrip().orElse(null);
        String regionName = region != null
                ? region.getName()
                : city != null ? city.getRegion().getName() : null;

        return new GetBucketListItemResponse(
                item.getId(),
                item.getName(),
                item.getCompletedOn(),
                city != null ? city.getId() : null,
                city != null ? city.getName() : null,
                region != null ? region.getId() : null,
                regionName,
                item.getDescription().orElse(null),
                trip != null ? trip.getId() : null,
                trip != null ? trip.getName() : null,
                item.getUpdatedOn().orElse(item.getCreatedOn()));
    }
}