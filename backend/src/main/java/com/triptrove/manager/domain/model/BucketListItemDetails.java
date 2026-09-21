package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BucketListItemDetails(Long id, String name, LocalDate completedOn, Boolean wouldRepeat, Integer cityId,
                                    String cityName, Integer regionId, String regionName, String description,
                                    Long tripId, String tripName, LocalDateTime changedOn) {
}