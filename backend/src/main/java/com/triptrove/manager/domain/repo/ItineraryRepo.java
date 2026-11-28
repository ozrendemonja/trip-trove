package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Itinerary;
import com.triptrove.manager.domain.model.ItineraryDateContentSummary;
import com.triptrove.manager.domain.model.ItineraryDay;
import com.triptrove.manager.domain.model.ItineraryDaySummary;
import com.triptrove.manager.domain.model.ItineraryDetails;
import com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary;
import com.triptrove.manager.domain.model.ItineraryDetails.EntrySummary;
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
import java.util.Map;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.triptrove.manager.domain.model.TripAttractionGroup.PRIMARY;
import static com.triptrove.manager.domain.model.TripAttractionGroup.SECONDARY;
import static com.triptrove.manager.domain.model.ItineraryDetails.ChangeNoticeSummary.Reason.TRIP_DATES_CHANGED;

public interface ItineraryRepo extends JpaRepository<Itinerary, Long> {
    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE itinerary SET last_checked_at = :checkedAt, dates_changed_since_check = FALSE
            WHERE trip_id = :tripId
              AND itinerary_check_context(trip_id, time_zone, last_checked_at, dates_changed_since_check) = :checkContext
            """, nativeQuery = true)
    int recordCheck(Long tripId, Instant checkedAt, String checkContext);

    @Query("""
            SELECT itinerary FROM Itinerary itinerary
            LEFT JOIN FETCH itinerary.days
            WHERE itinerary.tripId = :tripId
            """)
    Optional<Itinerary> findWithDaysByTripId(Long tripId);

    @Query("SELECT day FROM ItineraryDay day WHERE day.itinerary.tripId = :tripId AND day.date = :date")
    Optional<ItineraryDay> findDayByTripIdAndDate(Long tripId, LocalDate date);

    @Query("""
            SELECT new com.triptrove.manager.domain.repo.ItinerarySummaryRow(
                trip.from, trip.to, itinerary.timeZone, day.date, entry.id, entry.attractionId,
                COALESCE(attraction.name, entry.typedItem.name),
                entry.position, entry.fixedStart, entry.timing, entry.outgoingTransfer)
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
                if (row.entryId() != null) {
                    entries.add(new ItinerarySchedulingEntrySummary(row.entryId(), row.attractionId(), row.attractionName(),
                            row.position(), row.fixedStart(), row.timing(), row.outgoingTransfer()));
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
            SELECT new com.triptrove.manager.domain.model.ItineraryDateContentSummary(
                trip.from, trip.to, day.date, day.note, COALESCE(attraction.name, entry.typedItem.name), entry.timing)
            FROM Itinerary itinerary
            JOIN itinerary.trip trip
            JOIN itinerary.days day
            LEFT JOIN ItineraryEntry entry ON entry.tripId = itinerary.tripId AND entry.timing.date = day.date
            LEFT JOIN Attraction attraction ON attraction.id = entry.attractionId
            WHERE itinerary.tripId = :tripId
            ORDER BY day.date, entry.position
            """)
    List<ItineraryDateContentSummary> findDateContentSummariesByTripId(Long tripId);

    @Query("""
            SELECT EXISTS (SELECT 1 FROM ItineraryEntry entry
                WHERE entry.tripId = :tripId AND entry.attractionId IN :attractionIds)
                OR EXISTS (SELECT 1 FROM ItineraryGroupedAttraction member
                    WHERE member.tripId = :tripId AND member.attractionId IN :attractionIds)
            """)
    boolean hasScheduledAttractions(Long tripId, List<Long> attractionIds);

    // Attach board cards, typed items and removals to the first day only; entries are regrouped by their own dates.
    @Query("""
            SELECT new com.triptrove.manager.domain.repo.ItineraryAndBoardRow(
                itinerary.tripId, itinerary.timeZone, itinerary.lastCheckedAt, day.id, day.date, day.note,
                attraction.id, attraction.name, city.name, region.name, country.name, city.id, main.id,
                tripAttraction.attractionGroup,
                tripAttraction.mustVisit, attraction.category,
                tripAttraction.workingHours, tripAttraction.visitTime, tripAttraction.note,
                attraction.permanentlyClosedAt, entry.id, entry.timing.date, entry.position, entry.fixedStart,
                entry.timing, entry.includedInLastCheck, entry.outgoingTransfer, entry.transferChangedSinceCheck,
                entry.startChangedSinceCheck,
                entry.plannedLengthChangedSinceCheck, entry.fixedStartChangedSinceCheck, entry.movedSinceCheck,
                entry.followingStartsPushedSinceCheck, entry.groupChangedSinceCheck,
                removal.subject, removal.date, removal.followingStartsPushed, removal.cause,
                entry.watchedSourceBaseline, source.snapshot, member.hostEntryId, member.position,
                member.contributionMinutes, member.includedInLastCheck, member.joinedSinceLastCheck, member.watchedSourceBaseline,
                entry.typedItem, entry.itemChangedSinceCheck, itinerary.datesChangedSinceCheck,
                (SELECT cast(function('itinerary_check_context', saved.tripId, saved.timeZone, saved.lastCheckedAt,
                    saved.datesChangedSinceCheck) AS String)
                 FROM Itinerary saved WHERE saved.tripId = :tripId))
            FROM Itinerary itinerary
            JOIN itinerary.trip trip
            LEFT JOIN ItineraryDay day ON day.itinerary = itinerary
            LEFT JOIN (
                SELECT item.id AS boardId, CAST(NULL AS Long) AS removalId, CAST(NULL AS Long) AS itemEntryId
                FROM TripAttraction item WHERE item.trip.id = :tripId
                UNION ALL
                SELECT CAST(NULL AS Long) AS boardId, removed.id AS removalId, CAST(NULL AS Long) AS itemEntryId
                FROM ItineraryEntryRemoval removed WHERE removed.tripId = :tripId
                UNION ALL
                SELECT CAST(NULL AS Long) AS boardId, CAST(NULL AS Long) AS removalId, typed.id AS itemEntryId
                FROM ItineraryEntry typed WHERE typed.tripId = :tripId AND typed.typedItem.kind IS NOT NULL
            ) subject ON day.date = trip.from
            LEFT JOIN TripAttraction tripAttraction ON tripAttraction.id = subject.boardId
            LEFT JOIN ItineraryEntryRemoval removal ON removal.id = subject.removalId
            LEFT JOIN tripAttraction.attraction attraction
            LEFT JOIN attraction.city city
            LEFT JOIN attraction.main main
            LEFT JOIN attraction.region region
            LEFT JOIN attraction.country country
            LEFT JOIN ItineraryEntry entry ON entry.tripId = trip.id
                AND (entry.attractionId = attraction.id OR entry.id = subject.itemEntryId)
            LEFT JOIN ItineraryGroupedAttraction member ON member.tripId = trip.id AND member.attractionId = attraction.id
            LEFT JOIN TripAttractionWatchedSource source ON source.tripId = :tripId
                AND source.tripAttractionId = tripAttraction.id AND (entry.id IS NOT NULL OR member.id IS NOT NULL)
            WHERE itinerary.tripId = :tripId
            ORDER BY day.date, tripAttraction.boardPosition, tripAttraction.id, removal.id
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

        var daysById = new LinkedHashMap<Long, ItineraryAndBoardRow>();
        itineraryRows.forEach(row -> daysById.putIfAbsent(row.itineraryDayId(), row));
        var membersByHost = itineraryRows.stream().filter(row -> row.hostEntryId() != null)
                .sorted(Comparator.comparingInt(ItineraryAndBoardRow::memberPosition))
                .collect(Collectors.groupingBy(ItineraryAndBoardRow::hostEntryId));
        return Optional.of(new ItineraryDetails(firstRow.tripId(), firstRow.timeZone(), firstRow.lastCheckedAt(),
                itineraryDaysInDateOrder(itineraryRows, daysById, membersByHost), unscheduledAttractionsInBoardOrder(itineraryRows),
                changeNotices(itineraryRows, firstRow.lastCheckedAt(), membersByHost), firstRow.checkContext()));
    }

    private static List<ChangeNoticeSummary> changeNotices(List<ItineraryAndBoardRow> rows, Instant lastCheckedAt,
            Map<Long, List<ItineraryAndBoardRow>> membersByHost) {
        var hasBeenChecked = lastCheckedAt != null;
        var entries = rows.stream()
                .filter(row -> row.entryId() != null)
                .sorted(Comparator.comparing(ItineraryAndBoardRow::entryPosition))
                .map(row -> row.toChangeNotice(hasBeenChecked, membersByHost.getOrDefault(row.entryId(), List.of())))
                .filter(notice -> !notice.reasons().isEmpty() || !notice.sourceChanges().isEmpty()
                        || !notice.groupedSourceChanges().isEmpty());
        var removals = rows.stream().filter(row -> hasBeenChecked && row.removedSubject() != null)
                .map(ItineraryAndBoardRow::toRemovalNotice);
        var firstDay = rows.getFirst();
        var dateChanges = hasBeenChecked && firstDay.datesChangedSinceCheck()
                ? Stream.of(new ChangeNoticeSummary(null, "Trip dates", firstDay.itineraryDate(),
                        List.of(TRIP_DATES_CHANGED), null, List.of(), List.of()))
                : Stream.<ChangeNoticeSummary>empty();
        return Stream.concat(Stream.concat(entries, removals), dateChanges)
                .sorted(Comparator.comparing(ChangeNoticeSummary::date))
                .toList();
    }

    private static List<ItineraryDetails.Day> itineraryDaysInDateOrder(List<ItineraryAndBoardRow> itineraryRows,
            SequencedMap<Long, ItineraryAndBoardRow> daysById, Map<Long, List<ItineraryAndBoardRow>> membersByHost) {
        var entriesByDate = new HashMap<LocalDate, List<ItineraryAndBoardRow>>();
        for (var row : itineraryRows) {
            if (row.entryId() != null) {
                entriesByDate.computeIfAbsent(row.entryDate(), ignored -> new ArrayList<>()).add(row);
            }
        }
        return daysById.sequencedValues().stream()
                .map(day -> new ItineraryDetails.Day(day.itineraryDayId(), day.itineraryDate(), day.dayNote(),
                        entriesInPathOrder(entriesByDate.getOrDefault(day.itineraryDate(), List.of()), membersByHost)))
                .toList();
    }

    private static List<EntrySummary> entriesInPathOrder(List<ItineraryAndBoardRow> rows,
            Map<Long, List<ItineraryAndBoardRow>> membersByHost) {
        var ordered = rows.stream().sorted(Comparator.comparingInt(ItineraryAndBoardRow::entryPosition)).toList();
        return IntStream.range(0, ordered.size())
                .mapToObj(i -> ordered.get(i).toEntrySummary(i + 1 < ordered.size() ? ordered.get(i + 1).entryId() : null,
                        membersByHost.getOrDefault(ordered.get(i).entryId(), List.of())))
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
            if (row.isEligibleForItinerary() && row.entryId() == null && row.hostEntryId() == null) {
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
