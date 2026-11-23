package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.algorithm.FractionalIndexing;
import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.ItineraryRepo;
import com.triptrove.manager.domain.repo.TripAttractionRepo;
import com.triptrove.manager.domain.repo.TripRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Log4j2
public class TripServiceImpl implements TripService {
    private final ManagerProperties managerProperties;
    private final TripRepo tripRepo;
    private final AttractionRepo attractionRepo;
    private final TripAttractionRepo tripAttractionRepo;
    private final ItineraryRepo itineraryRepo;

    @Override
    @Transactional
    public Trip saveTrip(String tripName, LocalDate from, LocalDate to) {
        log.atInfo().log("Processing save trip request for trip '{}'", tripName);
        if (tripRepo.existsByNameAndDatesBetween(tripName, from, to)) {
            throw new BaseApiException("Trip name already exists in date range", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, tripName, from, to);
        }
        log.atInfo().log("Trip '{}' is unique within the specified date range", tripName);

        var trip = new Trip();
        trip.setName(tripName);
        trip.setFrom(from);
        trip.setTo(to);
        var result = tripRepo.save(trip);
        itineraryRepo.save(new Itinerary(result));

        log.atInfo().log("Trip '{}' successfully saved", result.getName());
        return result;
    }

    @Override
    public TripOverviewSummary getTrip(Long id) {
        log.atInfo().log("Getting trip with id '{}'", id);
        return tripRepo.findOverviewSummaryById(id)
                .orElseThrow(() -> new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
    }

    @Override
    @Transactional(readOnly = true)
    public ItineraryDetails getItinerary(Long tripId) {
        return itineraryRepo.findDetailsByTripId(tripId)
                .orElseThrow(() -> new BaseApiException("Itinerary not found for trip",
                        BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, tripId));
    }

    @Override
    @Transactional
    public void updateTripName(Long id, String newName) {
        log.atInfo().log("Updating the trip name");
        var trip = tripRepo.findById(id).orElseThrow(() -> new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        if (tripRepo.existsByNameAndDatesBetween(newName, trip.getFrom(), trip.getTo())) {
            throw new BaseApiException("Trip name already exists in date range", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, newName, trip.getFrom(), trip.getTo());
        }

        trip.setName(newName);
        tripRepo.save(trip);
        log.atInfo().log("Trip name has been updated");
    }

    @Override
    @Transactional
    public void updateTripRange(Long id, LocalDate fromTrip, LocalDate toTrip) {
        log.atInfo().log("Updating the trip range");
        var trip = tripRepo.findById(id).orElseThrow(() -> new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        if (trip.getFrom().equals(fromTrip) && trip.getTo().equals(toTrip)) {
            return;
        }
        if (tripRepo.existsByNameAndDatesBetween(trip.getName(), fromTrip, toTrip, id)) {
            throw new BaseApiException("Trip name already exists in date range", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, trip.getName(), fromTrip, toTrip);
        }

        if (itineraryRepo.findEntrySummariesByTripId(id).stream()
                .anyMatch(entry -> !entry.timing().fitsTripDates(fromTrip, toTrip))) {
            throw new BaseApiException("Proposed trip dates omit part of an entry",
                    BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.TRIP_DATES, id);
        }
        var itinerary = itineraryRepo.findWithDaysByTripId(id)
                .orElseThrow(() -> new IllegalStateException("Missing itinerary for trip " + id));
        itinerary.resizeEmptyDays(fromTrip, toTrip);
        trip.setFrom(fromTrip);
        trip.setTo(toTrip);
        log.atInfo().log("Trip range has been updated");
    }

    @Override
    public void deleteTrip(Long id) {
        log.atInfo().log("Deleting trip");
        if (!tripRepo.existsById(id)) {
            throw new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id);
        }
        if (tripAttractionRepo.existsByTripId(id) || !tripRepo.deleteIfEmpty(id)) {
            throw new BaseApiException("Trip still contains attractions", BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES, id);
        }
        log.atInfo().log("Trip deleted");
    }

    @Override
    @Transactional
    public void attachAttraction(Long tripId, Long attractionId, TripAttractionGroup attractionGroup) {
        log.atInfo().log("Add attraction under trip for trip '{}'", tripId);
        if (tripAttractionRepo.existsByTripIdAndAttractionId(tripId, attractionId)) {
            throw new BaseApiException(BaseApiException.ErrorCode.TRIP_ALREADY_CONTAINS_ATTRACTION, attractionId, tripId);
        }
        var trip = tripRepo.findById(tripId).orElseThrow(() -> new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, tripId));
        var attraction = attractionRepo.findById(attractionId).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId));

        var boardPosition = FractionalIndexing.indexAfter(tripAttractionRepo.findLastBoardPositionByTripId(tripId).orElse(null));
        trip.attachAttraction(attraction, attractionGroup, boardPosition);
        tripRepo.save(trip);
        tripRepo.recomputeArchived(tripId);

        log.atInfo().log("Attraction '{}' added under the trip", attraction.getName());
    }

    @Override
    @Transactional
    public void reviewAttraction(Long tripId, Long attractionId, Rating rating, String reviewNote) {
        log.atInfo().log("Reviewing attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.recordVisit(rating, reviewNote);
        tripAttractionRepo.save(attraction);
        tripRepo.recomputeArchived(tripId);
        log.atInfo().log("Attraction '{}' reviewed under the trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void clearReview(Long tripId, Long attractionId) {
        log.atInfo().log("Clearing review for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.clearReview();
        tripAttractionRepo.save(attraction);
        tripRepo.recomputeArchived(tripId);
        log.atInfo().log("Review cleared for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void updateAttractionGroup(Long tripId, Long attractionId, TripAttractionGroup attractionGroup) {
        log.atInfo().log("Updating attraction group for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        if (attractionGroup == TripAttractionGroup.EXCLUDED) {
            refuseDroppingScheduledAttractions(tripId, List.of(attractionId));
        }
        attraction.setAttractionGroup(attractionGroup);
        tripAttractionRepo.save(attraction);
        tripRepo.recomputeArchived(tripId);
        log.atInfo().log("Attraction group updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void moveAttractionOnBoard(Long tripId, Long attractionId, TripAttractionGroup targetGroup, Long previousAttractionId, Long nextAttractionId) {
        log.atInfo().log("Moving attraction '{}' on board for trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        var previousAttraction = previousAttractionId == null ? null : tripAttractionRepo.findByTripIdAndAttractionId(tripId, previousAttractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, previousAttractionId, tripId));
        var nextAttraction = nextAttractionId == null ? null : tripAttractionRepo.findByTripIdAndAttractionId(tripId, nextAttractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, nextAttractionId, tripId));
        var previousGroup = attraction.getAttractionGroup();
        if (targetGroup == TripAttractionGroup.EXCLUDED) {
            refuseDroppingScheduledAttractions(tripId, List.of(attractionId));
        }
        TripBoard.moveAttraction(attraction, targetGroup, previousAttraction, nextAttraction);
        tripAttractionRepo.save(attraction);
        if (previousGroup != attraction.getAttractionGroup()) {
            tripRepo.recomputeArchived(tripId);
        }
        log.atInfo().log("Attraction '{}' moved on board for trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void arrangeTripBoard(Long tripId, List<TripBoardItem> boardItems) {
        if (!tripRepo.existsById(tripId)) {
            throw new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, tripId);
        }

        var currentBoardAttractions = tripAttractionRepo.findBoardAttractionsByTripId(tripId);
        var currentGroupsByAttractionId = currentBoardAttractions.stream().collect(Collectors.toMap(attraction -> attraction.getAttraction().getId(), TripAttraction::getAttractionGroup));
        refuseDroppingScheduledAttractions(tripId, boardItems.stream().filter(item -> item.group() == TripAttractionGroup.EXCLUDED)
                .map(TripBoardItem::attractionId).toList());
        var changedAttractions = TripBoard.arrange(currentBoardAttractions, boardItems);
        tripAttractionRepo.saveAll(changedAttractions);
        var hasAttractionGroupChanged = changedAttractions.stream().anyMatch(attraction -> currentGroupsByAttractionId.get(attraction.getAttraction().getId()) != attraction.getAttractionGroup());
        if (hasAttractionGroupChanged) {
            tripRepo.recomputeArchived(tripId);
        }
    }

    @Override
    @Transactional
    public void updateAttractionMustVisit(Long tripId, Long attractionId, boolean mustVisit) {
        log.atInfo().log("Updating must visit for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.setMustVisit(mustVisit);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Must visit updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void updateAttractionWouldVisitAgain(Long tripId, Long attractionId, boolean wouldVisitAgain) {
        log.atInfo().log("Updating would visit again for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId)
                .orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.setWouldVisitAgain(wouldVisitAgain);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Would visit again updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void updateAttractionWorkingHours(Long tripId, Long attractionId, String workingHours) {
        log.atInfo().log("Updating working hours for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.setWorkingHours(workingHours);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Working hours updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void updateAttractionVisitTime(Long tripId, Long attractionId, String visitTime) {
        log.atInfo().log("Updating visit time for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.setVisitTime(visitTime);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Visit time updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void updateAttractionNote(Long tripId, Long attractionId, String note) {
        log.atInfo().log("Updating note for attraction '{}' under trip '{}'", attractionId, tripId);
        var attraction = tripAttractionRepo.findByTripIdAndAttractionId(tripId, attractionId).orElseThrow(() -> new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId));
        attraction.setNote(note);
        tripAttractionRepo.save(attraction);
        log.atInfo().log("Note updated for attraction '{}' under trip '{}'", attractionId, tripId);
    }

    @Override
    @Transactional
    public void detachAttraction(Long tripId, Long attractionId) {
        log.atInfo().log("Removing attraction from trip");
        if (tripRepo.deleteUnscheduledTripAttraction(tripId, attractionId) < 1) {
            refuseDroppingScheduledAttractions(tripId, List.of(attractionId));
            throw new BaseApiException("Attraction not found in trip", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, attractionId, tripId);
        }
        tripRepo.recomputeArchived(tripId);

        log.atInfo().log("Attraction '{}' removed from trip '{}'", attractionId, tripId);
    }

    private void refuseDroppingScheduledAttractions(Long tripId, List<Long> attractionIds) {
        if (!attractionIds.isEmpty() && itineraryRepo.hasScheduledAttractions(tripId, attractionIds)) {
            throw new BaseApiException("Board change would drop scheduled attractions",
                    BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES, ItineraryDependency.BOARD_MEMBERSHIP, tripId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripAttractionDetails> getAttractions(Long tripId) {
        log.atInfo().log("Getting attractions for trip '{}'", tripId);
        if (!tripRepo.existsById(tripId)) {
            throw new BaseApiException("Trip not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, tripId);
        }
        var result = tripAttractionRepo.findBoardDetailsByTripId(tripId);
        log.atInfo().log("Found '{}' attractions for trip", result.size());
        return result;
    }

    @Override
    public List<AttractionVisit> getVisitHistory(Long currentTripId, List<Long> attractionIds) {
        log.atInfo().log("Getting visit history for {} attractions, excluding trip '{}'", attractionIds.size(), currentTripId);
        if (attractionIds.isEmpty()) {
            return List.of();
        }
        var result = tripAttractionRepo.findVisitHistory(attractionIds, currentTripId);
        log.atInfo().log("Found '{}' visit history records", result.size());
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
    public List<CountryVisitSummary> getCountryVisitSummaries() {
        log.atInfo().log("Getting country visit summaries");
        var allAttractionsByCountry = attractionRepo.countAttractionsGroupedByCountryAndMustVisit();
        var visitedAttractionsByCountry = attractionRepo.countVisitedAttractionsGroupedByCountryAndMustVisit();

        var result = mergeIntoCountryVisitSummaries(allAttractionsByCountry, visitedAttractionsByCountry);
        log.atInfo().log("Country visit summaries computed for {} countries", result.size());
        return result;
    }

    private static List<CountryVisitSummary> mergeIntoCountryVisitSummaries(List<CountryAttractionCount> allAttractionsByCountry, List<CountryAttractionCount> visitedAttractionsByCountry) {
        var totalMustVisit = sumByCountry(allAttractionsByCountry, true);
        var totalOther = sumByCountry(allAttractionsByCountry, false);
        var visitedMustVisit = sumByCountry(visitedAttractionsByCountry, true);
        var visitedOther = sumByCountry(visitedAttractionsByCountry, false);

        var isoByCountry = java.util.stream.Stream.of(allAttractionsByCountry, visitedAttractionsByCountry).flatMap(java.util.List::stream).filter(row -> row.isoCode() != null).collect(java.util.stream.Collectors.toMap(CountryAttractionCount::countryName, CountryAttractionCount::isoCode, (a, b) -> a));

        return java.util.stream.Stream.of(totalMustVisit, totalOther, visitedMustVisit, visitedOther).flatMap(map -> map.keySet().stream()).distinct().map(country -> {
            long visitedMv = visitedMustVisit.getOrDefault(country, 0L);
            long totalMv = totalMustVisit.getOrDefault(country, 0L);
            long visitedOt = visitedOther.getOrDefault(country, 0L);
            long totalOt = totalOther.getOrDefault(country, 0L);
            return new CountryVisitSummary(country, isoByCountry.get(country), visitedMv, Math.max(0L, totalMv - visitedMv), visitedOt, Math.max(0L, totalOt - visitedOt));
        }).toList();
    }

    private static java.util.Map<String, Long> sumByCountry(List<CountryAttractionCount> rows, boolean mustVisit) {
        return rows.stream().filter(row -> row.mustVisitAttraction() == mustVisit).collect(java.util.stream.Collectors.toMap(CountryAttractionCount::countryName, CountryAttractionCount::attractionCount, Long::sum));
    }

    @Override
    public List<Trip> getTripsContaining(LocalDate date) {
        log.atInfo().log("Getting trips containing date '{}'", date);
        return tripRepo.findAllContainingDate(date);
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