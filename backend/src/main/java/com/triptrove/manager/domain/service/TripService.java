package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;

import java.time.LocalDate;
import java.util.List;

public interface TripService {
    Trip saveTrip(String tripName, LocalDate from, LocalDate to);

    TripOverviewSummary getTrip(Long id);

    ItineraryDetails getItinerary(Long tripId);

    void markItineraryChecked(Long tripId, String checkContext);

    void updateItineraryDayNote(Long tripId, LocalDate date, String note);

    void updateTripName(Long id, String newName);

    void updateTripRange(Long id, LocalDate fromTrip, LocalDate toTrip);

    void deleteTrip(Long id);

    void attachAttraction(Long tripId, Long attractionId, TripAttractionGroup attractionGroup);

    void reviewAttraction(Long tripId, Long attractionId, Rating rating, String reviewNote);

    void clearReview(Long tripId, Long attractionId);

    void updateAttractionWouldVisitAgain(Long tripId, Long attractionId, boolean wouldVisitAgain);

    void detachAttraction(Long tripId, Long attractionId, ItineraryRemovalConfirmation confirmedRemoval);

    void updateAttractionGroup(Long tripId, Long attractionId, TripAttractionGroup attractionGroup,
                               ItineraryRemovalConfirmation confirmedRemoval);

    void moveAttractionOnBoard(Long tripId, Long attractionId, TripAttractionGroup targetGroup,
                               Long previousAttractionId, Long nextAttractionId, ItineraryRemovalConfirmation confirmedRemoval);

    void arrangeTripBoard(Long tripId, List<TripBoardItem> boardItems);

    void updateAttractionMustVisit(Long tripId, Long attractionId, boolean mustVisit);

    void updateAttractionWorkingHours(Long tripId, Long attractionId, String workingHours);

    void updateAttractionVisitTime(Long tripId, Long attractionId, String visitTime);

    void updateAttractionNote(Long tripId, Long attractionId, String note);

    List<TripAttractionDetails> getAttractions(Long tripId);

    List<AttractionVisit> getVisitHistory(Long currentTripId, List<Long> attractionIds);

    CountriesSummary getCountriesSummary();

    List<CountryVisitSummary> getCountryVisitSummaries();

    List<Trip> getTripsContaining(LocalDate date);

    List<Trip> getTrips(ScrollPosition afterTrip, SortDirection sortDirection);
}
