package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Itinerary;
import com.triptrove.manager.domain.model.ItineraryDaySummary;
import com.triptrove.manager.domain.model.ItineraryDetails;
import com.triptrove.manager.domain.model.ItineraryDetails.AttractionEntrySummary;
import com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary;
import com.triptrove.manager.domain.model.ItineraryDetails.UnscheduledAttractionSummary;
import com.triptrove.manager.domain.model.ItineraryEntrySummary;
import com.triptrove.manager.domain.model.ItinerarySchedulingEntrySummary;
import com.triptrove.manager.domain.model.ItinerarySummary;
import com.triptrove.manager.domain.model.ItineraryTiming;
import com.triptrove.manager.domain.model.TripAttractionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.stream.Collectors;

import static com.triptrove.manager.domain.model.TripAttractionGroup.PRIMARY;
import static com.triptrove.manager.domain.model.TripAttractionGroup.SECONDARY;

public interface ItineraryRepo extends JpaRepository<Itinerary, Long> {
    @Modifying
    @Query("""
            UPDATE Itinerary itinerary SET itinerary.lastCheckedAt = :checkedAt
            WHERE itinerary.tripId = :tripId
            """)
    int recordCheck(Long tripId, Instant checkedAt);

    @Query("""
            SELECT itinerary FROM Itinerary itinerary
            LEFT JOIN FETCH itinerary.days
            WHERE itinerary.tripId = :tripId
            """)
    Optional<Itinerary> findWithDaysByTripId(Long tripId);

    @Query("""
            SELECT new com.triptrove.manager.domain.repo.ItinerarySummaryRow(
                trip.from, trip.to, itinerary.timeZone, day.date, entry.attractionId, attraction.name,
                entry.position, entry.fixedStart, entry.timing)
            FROM Itinerary itinerary
            JOIN itinerary.trip trip
            LEFT JOIN itinerary.days day
            LEFT JOIN ItineraryEntry entry ON entry.tripId = itinerary.tripId AND entry.timing.date = day.date
            LEFT JOIN Attraction attraction ON attraction.id = entry.attractionId
            WHERE itinerary.tripId = :tripId
            """)
    List<ItinerarySummaryRow> findSummaryRowsByTripId(Long tripId);

    default Optional<ItinerarySummary> findSummaryByTripId(Long tripId) {
        var rows = findSummaryRowsByTripId(tripId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }

        var entriesByDate = new HashMap<LocalDate, List<ItinerarySchedulingEntrySummary>>();
        for (var row : rows) {
            if (row.itineraryDate() != null) {
                var entries = entriesByDate.computeIfAbsent(row.itineraryDate(), ignored -> new ArrayList<>());
                if (row.attractionId() != null) {
                    entries.add(new ItinerarySchedulingEntrySummary(row.attractionId(), row.attractionName(),
                            row.position(), row.fixedStart(), row.timing()));
                }
            }
        }
        var days = entriesByDate.entrySet().stream()
                .map(day -> new ItineraryDaySummary(day.getKey(), List.copyOf(day.getValue())))
                .toList();
        var trip = rows.getFirst();
        return Optional.of(new ItinerarySummary(trip.tripStart(), trip.tripEnd(), trip.timeZone(), days));
    }

    @Query("""
            SELECT new com.triptrove.manager.domain.model.ItineraryEntrySummary(
                entry.attractionId, entry.timing.date, entry.position, entry.timing)
            FROM ItineraryEntry entry
            WHERE entry.tripId = :tripId
            """)
    List<ItineraryEntrySummary> findEntrySummariesByTripId(Long tripId);

    @Query("""
            SELECT EXISTS (SELECT 1 FROM ItineraryEntry entry
                WHERE entry.tripId = :tripId AND entry.attractionId IN :attractionIds)
            """)
    boolean hasScheduledAttractions(Long tripId, List<Long> attractionIds);

    // Join the board only to the first itinerary day so each attraction is returned once.
    @Query("""
            SELECT new com.triptrove.manager.domain.repo.ItineraryAndBoardRow(
                itinerary.tripId, itinerary.timeZone, itinerary.lastCheckedAt, day.id, day.date,
                attraction.id, attraction.name, city.name, region.name, country.name, tripAttraction.attractionGroup,
                tripAttraction.mustVisit, attraction.category, tripAttraction.workingHours, tripAttraction.visitTime,
                attraction.permanentlyClosedAt, entry.id, entry.timing.date, entry.position, entry.fixedStart,
                entry.timing, entry.includedInLastCheck, entry.startChangedSinceCheck,
                entry.plannedLengthChangedSinceCheck, entry.fixedStartChangedSinceCheck)
            FROM Itinerary itinerary
            JOIN itinerary.trip trip
            LEFT JOIN ItineraryDay day ON day.itinerary = itinerary
            LEFT JOIN TripAttraction tripAttraction ON tripAttraction.trip = trip AND day.date = trip.from
            LEFT JOIN tripAttraction.attraction attraction
            LEFT JOIN attraction.city city
            LEFT JOIN attraction.region region
            LEFT JOIN attraction.country country
            LEFT JOIN ItineraryEntry entry ON entry.tripId = trip.id AND entry.attractionId = attraction.id
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

        return Optional.of(new ItineraryDetails(firstRow.tripId(), firstRow.timeZone(), firstRow.lastCheckedAt(),
                itineraryDaysInDateOrder(itineraryRows), unscheduledAttractionsInBoardOrder(itineraryRows),
                changeNotices(itineraryRows, firstRow.lastCheckedAt())));
    }

    private static List<ChangeNoticeSummary> changeNotices(List<ItineraryAndBoardRow> rows, Instant lastCheckedAt) {
        if (lastCheckedAt == null) {
            return List.of();
        }
        return rows.stream()
                .filter(row -> row.entryId() != null && (!row.entryIncludedInLastCheck()
                        || row.startChangedSinceCheck() || row.plannedLengthChangedSinceCheck()
                        || row.fixedStartChangedSinceCheck()))
                .sorted(Comparator.comparing(ItineraryAndBoardRow::entryDate)
                        .thenComparing(ItineraryAndBoardRow::entryPosition))
                .map(ItineraryAndBoardRow::toChangeNotice)
                .toList();
    }

    private static List<ItineraryDetails.Day> itineraryDaysInDateOrder(List<ItineraryAndBoardRow> itineraryRows) {
        var datesByDayId = new LinkedHashMap<Long, LocalDate>();
        var entriesByDate = new HashMap<LocalDate, List<AttractionEntrySummary>>();
        for (var row : itineraryRows) {
            datesByDayId.putIfAbsent(row.itineraryDayId(), row.itineraryDate());
            if (row.entryId() != null) {
                entriesByDate.computeIfAbsent(row.entryDate(), ignored -> new ArrayList<>()).add(row.toEntrySummary());
            }
        }
        return datesByDayId.entrySet().stream()
                .map(day -> new ItineraryDetails.Day(day.getKey(), day.getValue(),
                        entriesByDate.getOrDefault(day.getValue(), List.of()).stream()
                                .sorted(Comparator.comparingInt(AttractionEntrySummary::position))
                                .toList()))
                .toList();
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
            // Scheduled and ineligible attractions still determine their place's position on the board.
            var unscheduledAtPlace = unscheduledByPlace.computeIfAbsent(place, ignored -> new ArrayList<>());
            if (row.isEligibleForItinerary() && row.entryId() == null) {
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
}
