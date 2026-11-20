package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.AttractionCategory;
import com.triptrove.manager.domain.model.Itinerary;
import com.triptrove.manager.domain.model.ItineraryDetails;
import com.triptrove.manager.domain.model.ItineraryDetails.UnscheduledAttractionSummary;
import com.triptrove.manager.domain.model.TripAttractionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.stream.Collectors;

import static com.triptrove.manager.domain.model.TripAttractionGroup.PRIMARY;
import static com.triptrove.manager.domain.model.TripAttractionGroup.SECONDARY;

public interface ItineraryRepo extends JpaRepository<Itinerary, Long> {
    @Query("""
            SELECT itinerary FROM Itinerary itinerary
            LEFT JOIN FETCH itinerary.days
            WHERE itinerary.tripId = :tripId
            """)
    Optional<Itinerary> findWithDaysByTripId(Long tripId);

    // Join the board only to the first itinerary day so each attraction is returned once.
    @Query("""
            SELECT new com.triptrove.manager.domain.repo.ItineraryRepo$ItineraryAndBoardRow(
                itinerary.tripId, itinerary.initialZone, itinerary.lastCheckedAt, day.id, day.date,
                attraction.id, attraction.name, city.name, region.name, country.name, tripAttraction.attractionGroup,
                tripAttraction.mustVisit, attraction.category, tripAttraction.workingHours, tripAttraction.visitTime,
                attraction.permanentlyClosedAt)
            FROM Itinerary itinerary
            JOIN itinerary.trip trip
            LEFT JOIN ItineraryDay day ON day.itinerary = itinerary
            LEFT JOIN TripAttraction tripAttraction ON tripAttraction.trip = trip AND day.date = trip.from
            LEFT JOIN tripAttraction.attraction attraction
            LEFT JOIN attraction.city city
            LEFT JOIN attraction.region region
            LEFT JOIN attraction.country country
            WHERE itinerary.tripId = :tripId
            ORDER BY day.date, tripAttraction.boardPosition, tripAttraction.id
            """)
    List<ItineraryAndBoardRow> findItineraryAndBoardRowsByTripId(Long tripId);

    default Optional<ItineraryDetails> findDetailsByTripId(Long tripId) {
        var itineraryRows = findItineraryAndBoardRowsByTripId(tripId);
        if (itineraryRows.isEmpty()) {
            return Optional.empty();
        }

        var firstRow = itineraryRows.getFirst();
        if (firstRow.itineraryDayId() == null) {
            throw new IllegalStateException("Itinerary for trip " + tripId + " has no days");
        }

        return Optional.of(new ItineraryDetails(firstRow.tripId(), firstRow.initialZone(), firstRow.lastCheckedAt(),
                itineraryDaysInDateOrder(itineraryRows), unscheduledAttractionsInBoardOrder(itineraryRows)));
    }

    private static List<ItineraryDetails.Day> itineraryDaysInDateOrder(List<ItineraryAndBoardRow> itineraryRows) {
        var daysById = new LinkedHashMap<Long, ItineraryDetails.Day>();
        for (var row : itineraryRows) {
            daysById.computeIfAbsent(row.itineraryDayId(), id -> new ItineraryDetails.Day(id, row.itineraryDate()));
        }
        return List.copyOf(daysById.values());
    }

    private static List<UnscheduledAttractionSummary> unscheduledAttractionsInBoardOrder(
            List<ItineraryAndBoardRow> itineraryRows) {
        var unscheduledByPlace = unscheduledAttractionsByBoardPlace(itineraryRows);
        var orderedAttractions = new ArrayList<>(attractionsInBoardColumn(PRIMARY, unscheduledByPlace));
        orderedAttractions.addAll(attractionsInBoardColumn(SECONDARY, unscheduledByPlace));
        return List.copyOf(orderedAttractions);
    }

    private static SequencedMap<String, List<UnscheduledAttractionSummary>> unscheduledAttractionsByBoardPlace(
            List<ItineraryAndBoardRow> itineraryRows) {
        var unscheduledByPlace = new LinkedHashMap<String, List<UnscheduledAttractionSummary>>();
        for (var row : itineraryRows) {
            if (!row.hasBoardAttraction()) {
                continue;
            }

            var place = row.boardPlaceName();
            // Closed and excluded attractions still determine the place's position on the board.
            var unscheduledAtPlace = unscheduledByPlace.computeIfAbsent(place, ignored -> new ArrayList<>());
            if (row.isEligibleForItinerary()) {
                unscheduledAtPlace.add(row.toUnscheduledAttractionSummary(place));
            }
        }
        return unscheduledByPlace;
    }

    private static List<UnscheduledAttractionSummary> attractionsInBoardColumn(
            TripAttractionGroup boardColumn,
            SequencedMap<String, List<UnscheduledAttractionSummary>> unscheduledByPlace) {
        return unscheduledByPlace.sequencedValues().stream()
                .flatMap(List::stream)
                .filter(attraction -> attraction.attractionGroup() == boardColumn)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    record ItineraryAndBoardRow(Long tripId, String initialZone, Instant lastCheckedAt,
                                Long itineraryDayId, LocalDate itineraryDate,
                                Long attractionId, String attractionName, String cityName, String regionName, String countryName,
                                TripAttractionGroup boardColumn, Boolean mustVisit, AttractionCategory category,
                                String workingHours, String visitDuration, LocalDateTime permanentlyClosedAt) {
        private boolean hasBoardAttraction() {
            return attractionId != null;
        }

        private String boardPlaceName() {
            if (cityName != null) {
                return cityName;
            }
            return regionName != null ? regionName : countryName;
        }

        private boolean isEligibleForItinerary() {
            return (boardColumn == PRIMARY || boardColumn == SECONDARY) && permanentlyClosedAt == null;
        }

        private UnscheduledAttractionSummary toUnscheduledAttractionSummary(String place) {
            return new UnscheduledAttractionSummary(attractionId, attractionName, place, boardColumn, mustVisit,
                    category, workingHours, visitDuration);
        }
    }
}
