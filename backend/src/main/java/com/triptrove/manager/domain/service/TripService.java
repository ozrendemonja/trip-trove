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

    void reviewAttraction(Long tripId, Long attractionId, Rating rating, String reviewNote);

    void clearReview(Long tripId, Long attractionId);

    void detachAttraction(Long tripId, Long attractionId);

    void updateAttractionGroup(Long tripId, Long attractionId, TripAttractionGroup attractionGroup);

    void updateAttractionMustVisit(Long tripId, Long attractionId, boolean mustVisit);

    void updateAttractionWorkingHours(Long tripId, Long attractionId, String workingHours);

    void updateAttractionVisitTime(Long tripId, Long attractionId, String visitTime);

    void updateAttractionNote(Long tripId, Long attractionId, String note);

    List<TripAttraction> getAttractions(Long tripId);

    CountriesSummary getCountriesSummary();

    List<Trip> getTrips(ScrollPosition afterTrip, SortDirection sortDirection);
}
