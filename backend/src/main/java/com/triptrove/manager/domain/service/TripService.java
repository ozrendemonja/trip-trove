package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;

import java.time.LocalDate;
import java.util.List;

public interface TripService {
    Trip saveTrip(String tripName, LocalDate from, LocalDate to);

    Trip getTrip(Long id);

    void updateTripName(Long id, String newName);

    void updateTripRange(Long id, LocalDate fromTrip, LocalDate toTrip);

    void deleteTrip(Long id);

    void attachAttraction(Long tripId, Long attractionId, TripAttractionGroup attractionGroup);

    void reviewAttraction(Long tripId, Long attractionId, Rating rating, String note);

    void detachAttraction(Long tripId, Long attractionId);

    List<TripAttraction> getAttractions(Long tripId);

    CountriesSummary getCountriesSummary();

    List<Trip> getTrips(ScrollPosition afterTrip, SortDirection sortDirection);
}
