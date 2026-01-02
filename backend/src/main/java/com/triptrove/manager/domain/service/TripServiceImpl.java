package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.Trip;
import com.triptrove.manager.domain.repo.TripRepo;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@AllArgsConstructor
@Log4j2
public class TripServiceImpl implements TripService {
    private final TripRepo tripRepo;

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
        if (!trip.getVisitedAttractions().isEmpty()) {
            throw new BaseApiException("Trip has attractions under", BaseApiException.ErrorCode.HAS_CHILDREN);
        }

        tripRepo.delete(trip);
        log.atInfo().log("Trip deleted");
    }
}