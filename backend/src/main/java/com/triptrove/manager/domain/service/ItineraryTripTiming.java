package com.triptrove.manager.domain.service;

import java.time.LocalDate;

record ItineraryTripTiming(LocalDate tripStart, LocalDate tripEnd, String timeZone) {
}
