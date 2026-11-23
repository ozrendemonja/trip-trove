package com.triptrove.manager.domain.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode.ITINERARY_CLOCK_GAP;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ItineraryTimingTest {
    @Test
    void restoringTimingRejectsASkippedClockAtConstruction() {
        var date = LocalDate.parse("2027-03-28");
        var clock = LocalTime.parse("02:30");

        assertThatThrownBy(() -> new ItineraryTiming("Europe/Belgrade", date, clock, null, 30))
                .isInstanceOfSatisfying(BaseApiException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ITINERARY_CLOCK_GAP);
                    assertThat(exception.getContext()).containsExactly("Europe/Belgrade");
                });
    }

    @Test
    void newTimingRejectsANegativeDurationAtConstruction() {
        var date = LocalDate.parse("2027-03-28");
        var clock = LocalTime.parse("09:00");

        assertThatThrownBy(() -> new ItineraryTiming(date, clock, ZoneId.of("Europe/Belgrade"), -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void restoredTimingRejectsANegativeDurationAtConstruction() {
        var date = LocalDate.parse("2027-03-28");
        var clock = LocalTime.parse("09:00");

        assertThatThrownBy(() -> new ItineraryTiming("Europe/Belgrade", date, clock, null, -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @CsvSource({
            "false, 2027-10-31T02:30+02:00, 2027-10-31T02:00+01:00",
            "true, 2027-10-31T02:30+01:00, 2027-10-31T03:00+01:00"
    })
    void restoredTimingPreservesTheOccurrenceAndElapsedDuration(
            boolean secondOccurrence, String expectedStart, String expectedEnd) {
        var timing = new ItineraryTiming("Europe/Belgrade", LocalDate.parse("2027-10-31"),
                LocalTime.parse("02:30"), secondOccurrence, 30);

        assertThat(timing.start().toString()).isEqualTo(expectedStart);
        assertThat(timing.end().toString()).isEqualTo(expectedEnd);
    }
}
