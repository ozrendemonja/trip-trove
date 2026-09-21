package com.triptrove.manager.domain.model;

import java.time.LocalDateTime;

public record RegionSummary(Integer id, String name, String countryName, LocalDateTime changedOn) {
}