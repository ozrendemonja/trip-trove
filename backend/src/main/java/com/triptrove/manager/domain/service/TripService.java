package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Trip;

import java.time.LocalDate;

public interface TripService {
    Trip saveTrip(String tripName, LocalDate from, LocalDate to);

    Trip getTrip(Long id);

    void updateTripName(Long id, String newName);

    void updateTripRange(Long id, LocalDate fromTrip, LocalDate toTrip);

    void deleteTrip(Long id);
}
