package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Instantiator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.ITINERARY_CLOCK_GAP;
import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.ITINERARY_INVALID_END_CLOCK;
import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.ITINERARY_START_OFFSET_NOT_AVAILABLE;
import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.ITINERARY_UNKNOWN_ZONE;

@Embeddable
@Getter
@Accessors(fluent = true)
@EqualsAndHashCode
@ToString
public final class ItineraryTiming {
    private static final Set<String> NAMED_ZONES = Set.copyOf(ZoneId.getAvailableZoneIds());

    @Column(name = "zone_id", nullable = false)
    private final String zone;

    @Column(name = "date", nullable = false)
    private final LocalDate date;

    @Column(name = "start_time", nullable = false)
    @JdbcTypeCode(SqlTypes.LOCAL_TIME)
    private final LocalTime startTime;

    @Column(name = "second_start_occurrence")
    private final Boolean secondStartOccurrence;

    @Column(name = "planned_minutes", nullable = false)
    private final int plannedMinutes;

    public ItineraryTiming(LocalDate date, LocalTime startTime, ZoneId zone, int minutes) {
        this(resolveStart(date, startTime, zone, null), minutes);
    }

    public static ZoneId requireNamedZone(String name) {
        if (!NAMED_ZONES.contains(name)) {
            throw new BaseApiException("Not a named time zone", ITINERARY_UNKNOWN_ZONE, name);
        }
        return ZoneId.of(name);
    }

    public static ItineraryTiming atLocalStart(LocalDate date, LocalTime time, ZoneId zone, int minutes, String offset) {
        var first = new ItineraryTiming(date, time, zone, minutes);
        if (offset == null || first.hasStartOffset(offset)) return first;
        return first.localStartCandidates(date, zone).stream().filter(start -> start.hasStartOffset(offset))
                .findFirst().orElseThrow(() -> new BaseApiException("Offset does not resolve the local start",
                        ITINERARY_START_OFFSET_NOT_AVAILABLE, offset));
    }

    public boolean hasStartOffset(String offset) {
        return start().getOffset().getId().equals(offset);
    }

    @Instantiator({"zone", "date", "startTime", "secondStartOccurrence", "plannedMinutes"})
    public ItineraryTiming(String zone, LocalDate date, LocalTime startTime,
                           Boolean secondStartOccurrence, int plannedMinutes) {
        this(resolveStart(date, startTime, zone == null ? null : ZoneId.of(zone), secondStartOccurrence),
                secondStartOccurrence, plannedMinutes);
    }

    private ItineraryTiming(ZonedDateTime start, int plannedMinutes) {
        var offsets = start.getZone().getRules().getValidOffsets(start.toLocalDateTime());
        this(start, offsets.size() > 1 ? start.getOffset().equals(offsets.getLast()) : null, plannedMinutes);
    }

    private ItineraryTiming(ZonedDateTime start, Boolean secondStartOccurrence, int plannedMinutes) {
        if (plannedMinutes < 0) {
            throw new IllegalArgumentException("Planned minutes must not be negative");
        }
        this.zone = start.getZone().getId();
        this.date = start.toLocalDate();
        this.startTime = start.toLocalTime();
        this.secondStartOccurrence = secondStartOccurrence;
        this.plannedMinutes = plannedMinutes;
    }

    private static List<ZoneOffset> validOffsets(LocalDate date, LocalTime time, ZoneId zone) {
        if (date == null || time == null || zone == null) {
            throw new IllegalArgumentException("Itinerary start and zone must not be null");
        }
        return zone.getRules().getValidOffsets(date.atTime(time));
    }

    private static ZonedDateTime resolveStart(LocalDate date, LocalTime time, ZoneId zone, Boolean secondOccurrence) {
        var offsets = validOffsets(date, time, zone);
        if (offsets.isEmpty()) {
            throw new BaseApiException("Local clock falls in a zone gap", ITINERARY_CLOCK_GAP, zone.getId());
        }
        var offset = Boolean.TRUE.equals(secondOccurrence) ? offsets.getLast() : offsets.getFirst();
        return ZonedDateTime.ofStrict(date.atTime(time), offset, zone);
    }

    private ZonedDateTime zonedStart() {
        return resolveStart(date, startTime, ZoneId.of(zone), secondStartOccurrence);
    }

    public ItineraryTiming withLocalStart(LocalTime clock) {
        return new ItineraryTiming(date, clock, ZoneId.of(zone), plannedMinutes);
    }

    public ItineraryTiming withStartAt(Instant instant) {
        return withStartAt(instant, ZoneId.of(zone));
    }

    public ItineraryTiming withStartAt(Instant instant, ZoneId destinationZone) {
        return atInstant(instant, destinationZone, plannedMinutes);
    }

    public static ItineraryTiming atInstant(Instant instant, ZoneId zone, int minutes) {
        return new ItineraryTiming(instant.atZone(zone), minutes);
    }

    public List<ItineraryTiming> localStartsOn(LocalDate destinationDate, ZoneId destinationZone) {
        if (date.equals(destinationDate) && zone.equals(destinationZone.getId())) {
            return List.of(this);
        }
        return localStartCandidates(destinationDate, destinationZone);
    }

    private List<ItineraryTiming> localStartCandidates(LocalDate destinationDate, ZoneId destinationZone) {
        var first = new ItineraryTiming(destinationDate, startTime, destinationZone, plannedMinutes);
        return Boolean.FALSE.equals(first.secondStartOccurrence)
                ? List.of(first, new ItineraryTiming(destinationZone.getId(), destinationDate, startTime, true, plannedMinutes))
                : List.of(first);
    }

    public ItineraryTiming withPlannedMinutes(int minutes) {
        return new ItineraryTiming(zone, date, startTime, secondStartOccurrence, minutes);
    }

    public ItineraryTiming withLocalEnd(LocalDate endDate, LocalTime endClock) {
        var start = zonedStart();
        var offsets = validOffsets(endDate, endClock, start.getZone());
        if (offsets.isEmpty()) {
            throw new BaseApiException("Local end clock falls in a zone gap", ITINERARY_CLOCK_GAP,
                    ItineraryTimingIssue.END_CLOCK, zone);
        }
        var end = endDate.atTime(endClock).toInstant(offsets.getFirst());
        var elapsed = Duration.between(start.toInstant(), end);
        if (elapsed.isNegative() || elapsed.getSeconds() % 60 != 0 || elapsed.getNano() != 0
                || elapsed.toMinutes() > Integer.MAX_VALUE) {
            throw new BaseApiException("End clock does not give a valid elapsed length", ITINERARY_INVALID_END_CLOCK,
                    endDate, endClock);
        }
        return withPlannedMinutes((int) elapsed.toMinutes());
    }

    public OffsetDateTime start() {
        return zonedStart().toOffsetDateTime();
    }

    public OffsetDateTime end() {
        return zonedStart().plusMinutes(plannedMinutes).toOffsetDateTime();
    }

    public boolean fitsTripDates(LocalDate from, LocalDate to) {
        if (date.isBefore(from) || date.isAfter(to)) {
            return false;
        }
        var end = end();
        var endDate = end.toLocalDate();
        if (endDate.isBefore(from)) {
            return false;
        }
        var afterLastDate = to.plusDays(1).atStartOfDay(ZoneId.of(zone)).toInstant();
        var endInstant = end.toInstant();
        return endInstant.equals(afterLastDate)
                || (!endDate.isAfter(to) && endInstant.isBefore(afterLastDate));
    }

    public boolean overlaps(ItineraryTiming other) {
        // Strict comparisons let a brief stop meet either boundary, but not lie inside an interval.
        return start().isBefore(other.end()) && other.start().isBefore(end());
    }
}
