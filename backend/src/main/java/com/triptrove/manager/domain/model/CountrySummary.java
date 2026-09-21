package com.triptrove.manager.domain.model;

import java.time.LocalDateTime;

public record CountrySummary(Integer id, String name, String continentName, String isoCode, LocalDateTime changedOn) {
}