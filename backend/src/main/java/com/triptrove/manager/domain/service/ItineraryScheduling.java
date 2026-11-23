package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.AttractionToSchedule;

import java.time.LocalDate;

public interface ItineraryScheduling {
    void scheduleAttractionOnDay(Long tripId, LocalDate date, AttractionToSchedule attraction);
}
