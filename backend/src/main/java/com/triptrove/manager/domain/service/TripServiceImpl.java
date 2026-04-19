package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.TripAttractionRepo;
import com.triptrove.manager.domain.repo.TripRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@AllArgsConstructor
@Log4j2
public class TripServiceImpl implements TripService {
    private final ManagerProperties managerProperties;
    private final TripRepo tripRepo;
    private final AttractionRepo attractionRepo;
    private final TripAttractionRepo tripAttractionRepo;

    @Override
    public Trip saveTrip(String tripName, LocalDate from, LocalDate to) {
        log.atInfo().log("Processing save trip request for trip '{}'", tripName);
        if (tripRepo.existsByNameAndDatesBetween(tripName, from, to)) {
            throw new BaseApiException("Trip '%s' already exists within the specified date range in the database".formatted(tripName), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }
        log.atInfo().log("Trip '{}' is unique within the specified date range", tripName);

        var trip = new Trip();
        trip.setName(tripName);
        trip.setFrom(from);
        trip.setTo(to);
        var result = tripRepo.save(trip);

        log.atInfo().log("Trip '{}' successfully saved", result.getName());
        return result;
    }

    @Override
    public Trip getTrip(Long id) {
        log.atInfo().log("Getting trip with id '{}'", id);
        return tripRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Trip not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

    @Override
    public void updateTripName(Long id, String newName) {
        log.atInfo().log("Updating the trip name");
        var trip = tripRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Trip not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        tripRepo.findAll().forEach(log::info);
        if (tripRepo.existsByNameAndDatesBetween(newName, trip.getFrom(), trip.getTo())) {
            throw new BaseApiException("Trip '%s' already exists within the specified date range in the database".formatted(newName), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }

        trip.setName(newName);
        tripRepo.save(trip);
        log.atInfo().log("Trip name has been updated");
    }

    @Override
    public void updateTripRange(Long id, LocalDate fromTrip, LocalDate toTrip) {
        log.atInfo().log("Updating the trip range");
        var trip = tripRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Trip not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        if (tripRepo.existsByNameAndDatesBetween(trip.getName(), fromTrip, toTrip)) {
            throw new BaseApiException("Trip '%s' already exists within the specified date range in the database".formatted(trip.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }

        trip.setFrom(fromTrip);
        trip.setTo(toTrip);
        tripRepo.save(trip);
        log.atInfo().log("Trip range has been updated");
    }

    @Override
    public void deleteTrip(Long id) {
        log.atInfo().log("Deleting trip");
        var trip = tripRepo.findById(id).orElseThrow(() -> new BaseApiException("Trip not found", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        if (!trip.getAttractions().isEmpty()) {
            throw new BaseApiException("Trip has attractions under", BaseApiException.ErrorCode.HAS_CHILDREN);
        }

        tripRepo.delete(trip);
        log.atInfo().log("Trip deleted");
    }

    @Override
    public void attachAttraction(Long tripId, Long attractionId, TripAttractionGroup attractionGroup) {
        log.atInfo().log("Add attraction under trip for trip '{}'", tripId);
        if (tripAttractionRepo.existsByTripIdAndAttractionId(tripId, attractionId)) {
            throw new BaseApiException("Attraction '%d' already exists under the trip in the database".formatted(attractionId), BaseApiException.ErrorCode.ATTRACTION_ALREADY_ADDED_TO_TRIP);
        }
        var trip = tripRepo.findById(tripId)
                .orElseThrow(() -> new BaseApiException("Trip not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        var attraction = attractionRepo.findById(attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));

        trip.attachAttraction(attraction, attractionGroup);
        tripRepo.save(trip);

        log.atInfo().log("Attraction '{}' added under the trip", attraction.getName());
    }

    @Override
    public void reviewAttraction(Long tripId, Long attractionId, Rating rating, String reviewNote) {
        log.atInfo().log("Reviewing attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.recordVisit(rating, reviewNote);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Attraction '{}' reviewed under the trip '{}'", attractionId, tripId);
    }

    @Override
    public void clearReview(Long tripId, Long attractionId) {
        log.atInfo().log("Clearing review for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.clearReview();
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Review cleared for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    public void updateAttractionGroup(Long tripId, Long attractionId, TripAttractionGroup attractionGroup) {
        log.atInfo().log("Updating attraction group for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setAttractionGroup(attractionGroup);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Attraction group updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    public void updateAttractionMustVisit(Long tripId, Long attractionId, boolean mustVisit) {
        log.atInfo().log("Updating must visit for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setMustVisit(mustVisit);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Must visit updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    public void updateAttractionWorkingHours(Long tripId, Long attractionId, String workingHours) {
        log.atInfo().log("Updating working hours for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setWorkingHours(workingHours);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Working hours updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    public void updateAttractionVisitTime(Long tripId, Long attractionId, String visitTime) {
        log.atInfo().log("Updating visit time for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setVisitTime(visitTime);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Visit time updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    public void updateAttractionNote(Long tripId, Long attractionId, String note) {
        log.atInfo().log("Updating note for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setNote(note);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Note updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    public void detachAttraction(Long tripId, Long attractionId) {
        log.atInfo().log("Removing attraction from trip");
        if (tripRepo.deleteTripAttraction(tripId, attractionId) < 1) {
            throw new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND);
        }

        log.atInfo().log("Attraction '{}' removed from trip '{}'", attractionId, tripId);
    }

    @Override
    public List<TripAttraction> getAttractions(Long tripId) {
        log.atInfo().log("Getting attractions for trip '{}'", tripId);
        if (!tripRepo.existsById(tripId)) {
            throw new BaseApiException("Trip not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND);
        }
        var result = tripAttractionRepo.findByTripId(tripId);
        log.atInfo().log("Found '{}' attractions for trip", result.size());
        return result;
    }

    @Override
    public CountriesSummary getCountriesSummary() {
        log.atInfo().log("Getting country summary");
        int visitedCountries = tripAttractionRepo.countDistinctVisitedCountries();
        log.atInfo().log("Country summary created");
        return new CountriesSummary(visitedCountries, managerProperties.totalCountries());
    }

    @Override
    public List<Trip> getTrips(ScrollPosition afterTrip, SortDirection sortDirection) {
        if (sortDirection == SortDirection.ASCENDING) {
            return getTripAfter(afterTrip);
        }
        return getTripBefore(afterTrip);
    }

    private List<Trip> getTripAfter(ScrollPosition trip) {
        if (trip == null) {
            log.atInfo().log("Getting a list of first {} oldest trips", managerProperties.pageSize());
            List<Trip> result = tripRepo.findAllOrderByOldest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} trips", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of oldest trips, updated after {}", trip.updatedOn());
        List<Trip> result = tripRepo.findOldestAfter(trip, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} trips", result.size());
        return result;
    }

    private List<Trip> getTripBefore(ScrollPosition trip) {
        if (trip == null) {
            log.atInfo().log("Getting a list of first {} newest trips", managerProperties.pageSize());
            List<Trip> result = tripRepo.findAllOrderByNewest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} trips", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of newest trips, updated before {}", trip.updatedOn());
        List<Trip> result = tripRepo.findNewestBefore(trip, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} trips", result.size());
        return result;
    }
}