package com.triptrove.manager;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class ItinerarySchedulingTest extends AbstractIntegrationTest {
    private static final String ITINERARY = "/trips/1/itinerary";
    private static final String SCHEDULE = ITINERARY + "/attractions";
    private static final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    @Autowired
    private MockMvc mockMvc;

    @Test
    void savesTheFirstEntryInOneRequestWithoutLockingItsStart() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");

        var location = schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""))
                .andReturn().getResponse().getHeader(HttpHeaders.LOCATION);

        mockMvc.perform(get(location).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeZone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.days[0].entries[0].entryId").isNumber())
                .andExpect(jsonPath("$.days[0].entries[0].id").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.days[0].entries[0].attractionId").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-28T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-28T10:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.zone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.plannedMinutes").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(false))
                .andExpect(jsonPath("$.days[0].entries[0].briefStop").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3)));
    }

    @ParameterizedTest
    @CsvSource({"45m,09:45", "2h,11:00", "1h 30m,10:30", "1h\u00a030m,10:30",
            "2-3h,12:00", "1h 30m-2h,11:00", "0m,09:00"})
    void anEntryUsesTheUpperBoundOfTheSourceDuration(String duration, String endClock) throws Exception {
        seedBoard("2027-03-28", "2027-03-28");
        setVisitDuration(1, duration);

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-28T" + endClock + "+02:00"));
    }

    @ParameterizedTest
    @MethodSource("boardChangesThatWouldDropAScheduledAttraction")
    void theBoardCannotExcludeOrRemoveAScheduledAttraction(MockHttpServletRequestBuilder change) throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        mockMvc.perform(change.header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("Scheduled attractions cannot be removed or excluded while they are in the itinerary."));
        itinerary().andExpect(jsonPath("$.days[0].entries[0].attractionId").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].attractionGroup").value("PRIMARY"));
    }

    static List<MockHttpServletRequestBuilder> boardChangesThatWouldDropAScheduledAttraction() {
        return List.of(
                delete("/trips/1/attractions/1"),
                put("/trips/1/attractions/1/group").content("""
                        {"attractionGroup":"EXCLUDED"}
                        """),
                put("/trips/1/board/attractions/1").content("""
                        {"targetGroup":"EXCLUDED"}
                        """),
                put("/trips/1/board").content("""
                        {"attractions":[{"attractionId":1,"group":"EXCLUDED"}]}
                        """));
    }

    @ParameterizedTest
    @CsvSource({"2027-03-29,2027-03-29", "2027-03-28,2027-03-28"})
    void shorteningDatesCannotOrphanAnOvernightEntry(String from, String to) throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "23:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        mockMvc.perform(put("/trips/1/range").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fromDate":"%s","toDate":"%s"}
                                """.formatted(from, to)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("Those dates would leave an itinerary entry outside the trip. Keep its start and end within the trip."));
        itinerary().andExpect(jsonPath("$.days[*].date", contains("2027-03-28", "2027-03-29")))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T01:00+02:00"));
    }

    @Test
    void anOvernightEntryStillOccupiesTimeOnTheFollowingDay() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "23:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 29), "00:30", null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("The chosen time overlaps another itinerary entry. Choose another start or day."));
        itinerary().andExpect(jsonPath("$.days[1].entries").isEmpty());
    }

    @Test
    void tripOverviewReportsWhetherThereAreSavedEntries() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        mockMvc.perform(get("/trips/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasItineraryEntries").value(false));

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 29), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/trips/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasItineraryEntries").value(true));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "-30m", "3-2h", "about an hour", "99999999999h"})
    void anInvalidSourceRequestsDurationBeforeStartAndTimeZone(String duration) throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        setVisitDuration(1, duration);

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), null, null, null))
                .andExpect(status().isBadRequest())
                .andExpect(header().doesNotExist(HttpHeaders.LOCATION))
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("Enter the required details to add this attraction."))
                .andExpect(jsonPath("$.schedulingInputs.requiredInputs", contains("VISIT_DURATION")))
                .andExpect(jsonPath("$.schedulingInputs.offsets").doesNotHaveJsonPath());

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), null, null, "45m"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("Enter the required details to add this attraction."))
                .andExpect(jsonPath("$.schedulingInputs.requiredInputs", contains("START", "TIME_ZONE")));

        itinerary().andExpect(jsonPath("$.timeZone").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(1, 2, 3)));
    }

    @Test
    void correctingAMissingDurationAndSettingTheZoneSucceedOnlyWithAValidProposedInterval() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        mockMvc.perform(put("/trips/1/attractions/1/visit-time").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 29), "23:30", "Europe/Belgrade", "45m"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("The entry would end after the trip, which ends on 2027-03-29."));
        itinerary().andExpect(jsonPath("$.timeZone").doesNotExist())
                .andExpect(jsonPath("$.days[1].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[0].visitDuration").doesNotExist());

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", "45m"))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.timeZone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.days[0].entries[0].visitDuration").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-28T09:45+02:00"));
        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].visitTime").value("45m"));
    }

    @Test
    void schedulingCannotReplaceAValidSourceDurationWithABriefStop() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        setVisitDuration(1, "2h");

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", "0m"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The trip already has a valid visit duration for this attraction. Edit it on the board to change it."));
        itinerary().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[0].visitDuration").value("2h"));
    }

    @Test
    void aBriefStopCanBeScheduledAtTheChosenEndOfThePreviousVisit() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        setVisitDuration(2, "30m");
        setVisitDuration(1, "0m");
        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 28), "01:45", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-28T03:15+02:00"));

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), null, null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.schedulingInputs.requiredInputs", contains("START")));
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "03:15", null, null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.timeZone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(2, 1)))
                .andExpect(jsonPath("$.days[0].entries[1].position").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-03-28T03:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value("2027-03-28T03:15+02:00"));
    }

    @Test
    void briefStopsAtTheSameInstantKeepTheirVisitOrderAfterReload() throws Exception {
        seedBoard("2027-03-28", "2027-03-28");
        setVisitDuration(3, "0m");
        setVisitDuration(1, "0m");

        schedule(new ScheduleAttractionRequest(
                3L, LocalDate.of(2027, 3, 28), "10:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "10:30", null, null))
                .andExpect(status().isNoContent());

        itinerary().andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(3, 1)));
    }

    @Test
    void reopeningUsesTheLocalStartAndCurrentPlannedLength() throws Exception {
        seedBoard("2027-01-15", "2027-01-15");
        setVisitDuration(1, "2h");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 1, 15), "10:00", "Asia/Bangkok", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-01-15T12:00+07:00"));

        entityManager.createNativeQuery("""
                UPDATE itinerary_entry SET planned_minutes = 90 WHERE trip_id = 1 AND attraction_id = 1
                """).executeUpdate();
        entityManager.clear();
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-01-15T10:00+07:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-01-15T11:30+07:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.plannedMinutes").doesNotHaveJsonPath());
    }

    @Test
    void changingOnlyTheEntryDateKeepsTheLocalClockOnItsNewDay() throws Exception {
        seedBoard("2027-03-27", "2027-03-28");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 27), "10:00:15", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        entityManager.createNativeQuery("""
                UPDATE itinerary_entry SET date = DATE '2027-03-28' WHERE trip_id = 1 AND attraction_id = 1
                """).executeUpdate();
        entityManager.clear();

        itinerary().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value("2027-03-28T10:00:15+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].timing.end").value("2027-03-28T11:30:15+02:00"));
    }

    @Test
    void theSkippedSpringClockIsRejectedWithoutSavingTheZone() throws Exception {
        seedBoard("2027-03-28", "2027-03-28");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "02:30", "Europe/Belgrade", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("That start clock does not occur in Europe/Belgrade on this date. Choose another time."))
                .andExpect(jsonPath("$.schedulingInputs").doesNotExist());
        itinerary().andExpect(jsonPath("$.timeZone").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries").isEmpty());
    }

    @Test
    void aSavedClockInAGapKeepsTheDomainErrorWhenReopened() throws Exception {
        seedBoard("2027-03-28", "2027-03-28");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        entityManager.createNativeQuery("""
                UPDATE itinerary_entry SET start_time = TIME '02:30'
                WHERE trip_id = 1 AND attraction_id = 1
                """).executeUpdate();
        entityManager.clear();

        mockMvc.perform(get(ITINERARY).header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("That start clock does not occur in Europe/Belgrade on this date. Choose another time."));
    }

    @Test
    void aRepeatedClockUsesTheFirstOccurrence() throws Exception {
        seedBoard("2027-10-31", "2027-10-31");
        setVisitDuration(1, "30m");
        setVisitDuration(2, "30m");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 10, 31), "02:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-10-31T02:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-10-31T02:00+01:00"));

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 10, 31), "02:00", null, null))
                .andExpect(status().isNoContent());
        entityManager.clear();
        itinerary().andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(2, 1)))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-10-31T02:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-10-31T02:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-10-31T02:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value("2027-10-31T02:00+01:00"));
    }

    @Test
    void aRepeatedSuggestedEndStillUsesTheFirstOccurrenceAndCanOverlap() throws Exception {
        seedBoard("2027-10-31", "2027-10-31");
        setVisitDuration(1, "90m");
        setVisitDuration(2, "0m");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 10, 31), "01:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-10-31T02:00+01:00"));

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 10, 31), "02:00", null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The chosen time overlaps another itinerary entry. Choose another start or day."));
        itinerary().andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(1)))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3)));
    }

    @Test
    void reopeningPreservesAnExistingSecondOccurrence() throws Exception {
        seedBoard("2027-10-31", "2027-10-31");
        setVisitDuration(1, "30m");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 10, 31), "02:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        entityManager.createNativeQuery("""
                UPDATE itinerary_entry SET second_start_occurrence = true WHERE trip_id = 1 AND attraction_id = 1
                """).executeUpdate();
        entityManager.clear();
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-10-31T02:30+01:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-10-31T03:00+01:00"));
    }

    @Test
    void anEndAtTheTripBoundaryFitsButALaterEndOrStartOnTheNextDayDoesNot() throws Exception {
        seedBoard("2027-03-28", "2027-03-28");
        setVisitDuration(1, "30m");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "23:31", "Europe/Belgrade", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("The entry would end after the trip, which ends on 2027-03-28."));
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "23:30", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T00:00+02:00"));
        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 29), "00:00", null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("There is no itinerary day for 2027-03-29. Choose another day."));
    }

    @Test
    void aSecondAdditionUsesTheChosenClockAndLeavesTheGapWithoutAPreview() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-28T10:30+02:00"));
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "15:00", null, null))
                .andExpect(status().isNoContent());
        itinerary().andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(2, 1)))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-28T10:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-03-28T15:00+02:00"))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(3)));
    }

    @Test
    void anEarlierFreeClockInsertsBeforeSavedVisitsWithoutMovingTheirTimes() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        setVisitDuration(1, "2h");
        setVisitDuration(2, "1h");
        setVisitDuration(3, "30m");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 28), "14:00", null, null))
                .andExpect(status().isNoContent());
        schedule(new ScheduleAttractionRequest(
                3L, LocalDate.of(2027, 3, 28), "08:00", null, null))
                .andExpect(status().isNoContent());

        itinerary()
                .andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(3, 1, 2)))
                .andExpect(jsonPath("$.days[0].entries[*].position").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        "2027-03-28T08:00+02:00", "2027-03-28T09:00+02:00", "2027-03-28T14:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[*].timing.end", contains(
                        "2027-03-28T08:30+02:00", "2027-03-28T11:00+02:00", "2027-03-28T15:00+02:00")));
        assertThat(entityManager.createQuery("""
                SELECT e.position FROM ItineraryEntry e WHERE e.tripId = 1 ORDER BY e.position
                """, Integer.class).getResultList()).containsExactly(1, 2, 3);
    }

    @Test
    void anOverlappingChosenClockIsRejectedRatherThanMovedAfterThePreviousVisit() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 28), "09:15", null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The chosen time overlaps another itinerary entry. Choose another start or day."));
        itinerary().andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(1)))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3)));
    }

    @Test
    void schedulingRejectsExcludedClosedAndAbsentAttractions() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        mockMvc.perform(put("/trips/1/attractions/1/group").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"attractionGroup\":\"EXCLUDED\"}"))
                .andExpect(status().isNoContent());
        entityManager.createNativeQuery("""
                UPDATE attraction SET permanently_closed_at = '2027-03-08' WHERE id = 2
                """).executeUpdate();

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("Only attractions on the Top Attractions or Secondary Spots board that are not permanently closed can be added."));
        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("Only attractions on the Top Attractions or Secondary Spots board that are not permanently closed can be added."));
        schedule(new ScheduleAttractionRequest(
                4L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The requested resource '4' could not be found. Please refresh and try again."));
        itinerary().andExpect(jsonPath("$.days[0].entries").isEmpty());
    }

    @Test
    void aMissingDayIsReportedAfterBoardMembershipButBeforeEligibility() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        entityManager.createNativeQuery("""
                DELETE FROM itinerary_day WHERE trip_id = 1 AND date = DATE '2027-03-29';
                UPDATE trip_attraction SET attraction_group = 'EXCLUDED' WHERE trip_id = 1 AND attraction_id = 1;
                """).executeUpdate();

        schedule(new ScheduleAttractionRequest(
                4L, LocalDate.of(2027, 3, 29), null, null, null))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The requested resource '4' could not be found. Please refresh and try again."));

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 29), null, null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("There is no itinerary day for 2027-03-29. Choose another day."));
    }

    @Test
    void aScheduledAttractionCannotBeScheduledAgainOnAnotherDay() throws Exception {
        seedBoard("2027-03-28", "2027-03-29");
        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 28), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2027, 3, 29), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("This attraction is already in the itinerary."));
        itinerary().andExpect(jsonPath("$.days[0].entries.length()").value(1))
                .andExpect(jsonPath("$.days[1].entries").isEmpty());
    }

    private ResultActions itinerary() throws Exception {
        return mockMvc.perform(get(ITINERARY).header("x-api-version", "1")).andExpect(status().isOk());
    }

    private ResultActions schedule(ScheduleAttractionRequest request) throws Exception {
        return mockMvc.perform(post(SCHEDULE).header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)));
    }

    private void setVisitDuration(int attractionId, String duration) throws Exception {
        mockMvc.perform(put("/trips/1/attractions/{id}/visit-time", attractionId).header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"visitTime":"%s"}
                                """.formatted(duration)))
                .andExpect(status().isNoContent());
    }

    private void seedBoard(String from, String to) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, 3);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = CAST(:from AS date), trip_end_date = CAST(:to AS date) WHERE id = 1;
                INSERT INTO itinerary(trip_id) VALUES (1);
                INSERT INTO itinerary_day(trip_id, date)
                SELECT 1, CAST(:from AS date) + day_offset
                FROM generate_series(0, CAST(:to AS date) - CAST(:from AS date)) AS days(day_offset);
                """).setParameter("from", from).setParameter("to", to).executeUpdate();
    }
}
