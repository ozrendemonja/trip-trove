package com.triptrove.manager.domain.model;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public record TripRangeImpactSummary(LocalDate currentFromDate, LocalDate currentToDate,
                                     boolean shiftBlocked, List<Blocker> blockers) {
    public record Blocker(LocalDate date, Kind kind, String content) {
        public enum Kind {
            DAY_NOTE, ENTRY, OVERNIGHT_ENTRY
        }
    }

    public static TripRangeImpactSummary mapDays(List<ItineraryDateContentSummary> rows, LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("Invalid proposed trip dates: " + from + " to " + to);
        }

        var current = rows.getFirst();
        var removed = current.tripFrom().datesUntil(current.tripTo().plusDays(1))
                .filter(date -> outside(date, from, to)).collect(Collectors.toCollection(LinkedHashSet::new));
        var blockers = new LinkedHashSet<Blocker>();
        if (!removed.isEmpty()) {
            for (var row : rows) {
                if (removed.contains(row.date())) {
                    if (row.dayNote() != null) {
                        blockers.add(new Blocker(row.date(), Blocker.Kind.DAY_NOTE, row.dayNote()));
                    }
                    if (row.timing() != null) {
                        blockers.add(new Blocker(row.date(), Blocker.Kind.ENTRY, row.entryName()));
                    }
                }
                if (row.timing() != null && !row.timing().fitsTripDates(from, to)) {
                    var end = row.timing().end();
                    var zone = ZoneId.of(row.timing().zone());
                    for (var date : removed) {
                        if (date.isAfter(row.date()) && !date.isAfter(end.toLocalDate())) {
                            var dayStart = date.atStartOfDay(zone);
                            if (dayStart.toLocalDate().equals(date) && end.toInstant().isAfter(dayStart.toInstant())) {
                                blockers.add(new Blocker(date, Blocker.Kind.OVERNIGHT_ENTRY, row.entryName()));
                            }
                        }
                    }
                }
            }
        }
        boolean nonContainingRange = (from.isBefore(current.tripFrom()) && to.isBefore(current.tripTo()))
                || (from.isAfter(current.tripFrom()) && to.isAfter(current.tripTo()));
        var firstContent = nonContainingRange
                ? rows.stream().filter(row -> row.dayNote() != null || row.timing() != null).findFirst()
                : Optional.<ItineraryDateContentSummary>empty();
        if (blockers.isEmpty()) {
            firstContent.ifPresent(row -> blockers.add(row.dayNote() != null
                    ? new Blocker(row.date(), Blocker.Kind.DAY_NOTE, row.dayNote())
                    : new Blocker(row.date(), Blocker.Kind.ENTRY, row.entryName())));
        }
        return new TripRangeImpactSummary(current.tripFrom(), current.tripTo(), firstContent.isPresent(),
                blockers.stream().sorted(Comparator.comparing(Blocker::date)).toList());
    }

    public void requireUnblocked() {
        if (!blockers.isEmpty()) {
            var first = blockers.getFirst();
            var dependency = shiftBlocked ? ItineraryDependency.TRIP_DATES_SHIFT
                    : first.kind() == Blocker.Kind.DAY_NOTE
                        ? ItineraryDependency.TRIP_DATES_WITH_DAY_NOTE : ItineraryDependency.TRIP_DATES;
            throw new BaseApiException("Proposed trip dates omit itinerary content",
                    BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES, dependency, first.date(), first.content());
        }
    }

    private static boolean outside(LocalDate date, LocalDate from, LocalDate to) {
        return date.isBefore(from) || date.isAfter(to);
    }
}
