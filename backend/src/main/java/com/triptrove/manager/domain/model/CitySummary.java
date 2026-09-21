package com.triptrove.manager.domain.model;

import java.time.LocalDateTime;

public record CitySummary(Integer id, String name, String regionName, String countryName, LocalDateTime changedOn) {
}