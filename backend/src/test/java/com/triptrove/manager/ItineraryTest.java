package com.triptrove.manager;

import com.jayway.jsonpath.JsonPath;
import com.triptrove.manager.application.dto.AddItineraryItemRequest;
import com.triptrove.manager.application.dto.CheckItineraryRequest;
import com.triptrove.manager.application.dto.ItineraryItemFields;
import com.triptrove.manager.application.dto.MoveAttractionOnBoardRequest;
import com.triptrove.manager.application.dto.MoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.SaveTripRequest;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.TripAttractionGroupDTO;
import com.triptrove.manager.application.dto.UpdateItineraryDayNoteRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionMustVisitRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionNoteRequest;
import com.triptrove.manager.application.dto.UpdateTripRangeRequest;
import com.triptrove.manager.domain.model.ItineraryItemKind;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class ItineraryTest extends AbstractIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper mapper;

    @ParameterizedTest
    @MethodSource("newTrips")
    void aNewTripHasOneItineraryDayPerInclusiveDate(String from, String to, List<String> dates) throws Exception {
        var trip = createTrip("Winter trip", from, to);

        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[*].date", contains(dates.toArray(String[]::new))))
                .andExpect(jsonPath("$.timeZone").doesNotExist())
                .andExpect(jsonPath("$.lastCheckedAt").doesNotExist())
                .andExpect(jsonPath("$.unscheduledAttractions").isEmpty());
    }

    private static Stream<Arguments> newTrips() {
        return Stream.of(
                Arguments.of("2028-02-28", "2028-03-01", List.of("2028-02-28", "2028-02-29", "2028-03-01")),
                Arguments.of("2028-02-29", "2028-02-29", List.of("2028-02-29"))
        );
    }

    @Test
    void readingAnItineraryReturnsItsStoredMetadata() throws Exception {
        var trip = createTrip("Checked itinerary", "2028-02-01", "2028-02-02");
        var tripId = Long.parseLong(trip.substring(trip.lastIndexOf('/') + 1));
        entityManager.createNativeQuery("""
                UPDATE itinerary SET time_zone = 'Europe/Belgrade', last_checked_at = '2028-01-30T09:00:00Z'
                WHERE trip_id = :tripId
                """).setParameter("tripId", tripId).executeUpdate();

        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(tripId))
                .andExpect(jsonPath("$.timeZone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.initialZone").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.lastCheckedAt").value("2028-01-30T09:00:00Z"));
    }

    @Test
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    void anExplicitCheckCanRecordAnEmptyItinerary() throws Exception {
        var trip = createTrip("Checking an empty itinerary", "2028-02-01", "2028-02-01");
        var itinerary = trip + "/itinerary";
        try {
            var displayed = mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                    .andExpect(jsonPath("$.lastCheckedAt").doesNotExist())
                    .andReturn().getResponse().getContentAsString();

            submitCheck(itinerary, JsonPath.read(displayed, "$.checkContext"))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string(HttpHeaders.LOCATION, itinerary))
                    .andExpect(content().string(""));

            mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                    .andExpect(jsonPath("$.lastCheckedAt").value(not(emptyOrNullString())))
                    .andExpect(jsonPath("$.days[0].entries").isEmpty())
                    .andExpect(jsonPath("$.timeZone").doesNotExist())
                    .andExpect(jsonPath("$.changeNotices").isEmpty());
        } finally {
            mockMvc.perform(delete(trip).header("x-api-version", "1")).andExpect(status().isNoContent());
        }
    }

    @Test
    void aDayNoteIsAnUntimedReminderAndDoesNotAffectChecks() throws Exception {
        var trip = createTrip("Notes only", "2028-02-01", "2028-02-02");
        var itinerary = trip + "/itinerary";
        var dayNote = itinerary + "/days/2028-02-02/note";
        var note = "  Bring the tickets\nMeet by the gate.  ";
        var empty = mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].note").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        saveNote(dayNote, new UpdateItineraryDayNoteRequest(note))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, itinerary))
                .andExpect(content().string(""));
        mockMvc.perform(get(trip).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasItineraryEntries").value(false))
                .andExpect(jsonPath("$.hasItineraryDayNotes").value(true));

        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.days[0].note").doesNotExist())
                .andExpect(jsonPath("$.days[1].note").value(note))
                .andExpect(jsonPath("$.days[*].entries[*]").isEmpty())
                .andExpect(jsonPath("$.changeNotices").isEmpty());
        submitCheck(itinerary, JsonPath.read(empty, "$.checkContext")).andExpect(status().isNoContent());

        var checked = mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.days[1].note").value(note))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andReturn().getResponse().getContentAsString();
        String checkedContext = JsonPath.read(checked, "$.checkContext");

        var edited = "Bring the tickets and ID.";
        saveNote(dayNote, new UpdateItineraryDayNoteRequest(edited)).andExpect(status().isNoContent());
        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.days[1].note").value(edited))
                .andExpect(jsonPath("$.checkContext").value(checkedContext))
                .andExpect(jsonPath("$.changeNotices").isEmpty());

        saveNote(dayNote, new UpdateItineraryDayNoteRequest("")).andExpect(status().isNoContent());
        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.days[1].note").doesNotExist())
                .andExpect(jsonPath("$.checkContext").value(checkedContext))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
        mockMvc.perform(get(trip).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasItineraryDayNotes").value(false));
    }

    private ResultActions saveNote(String path, Object request) throws Exception {
        return mockMvc.perform(put(path).header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)));
    }

    @Test
    void movingAnAttractionShowsItsCurrentTripNoteAndLeavesTheDayNoteOnItsDate() throws Exception {
        seedItineraryWithBoard(2);
        var itinerary = "/trips/1/itinerary";
        var tripNote = "/trips/1/attractions/1/note";
        saveNote(tripNote, new UpdateTripAttractionNoteRequest("Use the side entrance"))
                .andExpect(status().isNoContent());
        saveNote(itinerary + "/days/2026-09-01/note", new UpdateItineraryDayNoteRequest("Collect the tickets"))
                .andExpect(status().isNoContent());
        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unscheduledAttractions[0].tripNote").value("Use the side entrance"));

        schedule(new ScheduleAttractionRequest(1L, LocalDate.of(2026, 9, 1), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        var initial = mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].entries[0].tripNote").value("Use the side entrance"))
                .andReturn().getResponse().getContentAsString();
        submitCheck(itinerary, JsonPath.read(initial, "$.checkContext")).andExpect(status().isNoContent());
        entityManager.clear();

        int entryId = JsonPath.read(initial, "$.days[0].entries[0].entryId");
        var position = new MoveItineraryEntryRequest(LocalDate.of(2026, 9, 2), null, null);
        mockMvc.perform(put(itinerary + "/entries/{id}/position", entryId).header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(position)))
                .andExpect(status().isNoContent());
        var moved = mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].note").value("Collect the tickets"))
                .andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.days[1].note").doesNotExist())
                .andExpect(jsonPath("$.days[1].entries[0].entryId").value(entryId))
                .andExpect(jsonPath("$.days[1].entries[0].tripNote").value("Use the side entrance"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_MOVED")))
                .andReturn().getResponse().getContentAsString();

        saveNote(tripNote, new UpdateTripAttractionNoteRequest("Use the main entrance"))
                .andExpect(status().isNoContent());
        submitCheck(itinerary, JsonPath.read(moved, "$.checkContext"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ITINERARY_CHECK_STALE"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The itinerary or its attraction sources changed. Refresh and review the itinerary before checking again."));
        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].note").value("Collect the tickets"))
                .andExpect(jsonPath("$.days[1].entries[0].tripNote").value("Use the main entrance"))
                .andExpect(jsonPath("$.changeNotices[*].entryId", contains(entryId)))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[*].field", contains("TRIP_NOTE")));
    }

    @Test
    void dayNotesAcceptTheExactLimitAndRejectAnOverlongReplacement() throws Exception {
        var itinerary = createTrip("Day note", "2026-09-01", "2026-09-01") + "/itinerary";
        var path = itinerary + "/days/2026-09-01/note";
        var maximum = "x".repeat(1999) + "\n";

        saveNote(path, new UpdateItineraryDayNoteRequest(maximum)).andExpect(status().isNoContent());
        saveNote(path, new UpdateItineraryDayNoteRequest("y" + maximum))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("{note = Day note may not be longer than 2000 characters}"));
        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].note").value(maximum))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void checkingAnUnknownItineraryReturnsNotFound() throws Exception {
        submitCheck("/trips/9223372036854775807/itinerary", "unavailable")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The requested resource '9223372036854775807' could not be found. Please refresh and try again."));
    }

    @Test
    void additionsAreGroupedByEntryAfterACheckAndAcknowledgedByTheNextCheck() throws Exception {
        seedItineraryWithBoard(4);
        entityManager.createNativeQuery("""
                UPDATE attraction SET name = 'Museum' WHERE id = 2;
                UPDATE attraction SET name = 'Garden' WHERE id = 3;
                """).executeUpdate();

        schedule(new ScheduleAttractionRequest(
                1L, LocalDate.of(2026, 9, 1), "09:00", "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        var displayed = mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andReturn().getResponse().getContentAsString();

        submitCheck("/trips/1/itinerary", JsonPath.read(displayed, "$.checkContext")).andExpect(status().isNoContent());
        var checked = mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andReturn().getResponse().getContentAsString();
        String checkTime = JsonPath.read(checked, "$.lastCheckedAt");

        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2026, 9, 2), "10:00", null, null))
                .andExpect(status().isNoContent());
        schedule(new ScheduleAttractionRequest(
                3L, LocalDate.of(2026, 9, 1), "15:00", null, null))
                .andExpect(status().isNoContent());
        schedule(new ScheduleAttractionRequest(
                2L, LocalDate.of(2026, 9, 1), "11:00", null, null))
                .andExpect(status().isBadRequest());
        schedule(new ScheduleAttractionRequest(
                4L, LocalDate.of(2026, 9, 2), "10:15", null, null))
                .andExpect(status().isBadRequest());

        entityManager.clear();
        var changed = mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.lastCheckedAt").value(checkTime))
                .andExpect(jsonPath("$.changeNotices[*].subject", contains("Garden", "Museum")))
                .andExpect(jsonPath("$.changeNotices[*].date", contains("2026-09-01", "2026-09-02")))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ATTRACTION_ADDED")))
                .andExpect(jsonPath("$.changeNotices[1].reasons", contains("ATTRACTION_ADDED")))
                .andReturn().getResponse().getContentAsString();
        int museumEntryId = JsonPath.read(changed, "$.days[1].entries[0].entryId");
        int gardenEntryId = JsonPath.read(changed, "$.days[0].entries[1].entryId");
        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changeNotices[*].entryId", contains(gardenEntryId, museumEntryId)));

        submitCheck("/trips/1/itinerary", JsonPath.read(changed, "$.checkContext")).andExpect(status().isNoContent());
        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.lastCheckedAt").value(not(checkTime)))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(1, 3)))
                .andExpect(jsonPath("$.days[1].entries[*].attractionId", contains(2)));
    }

    private ResultActions submitCheck(String itinerary, String context) throws Exception {
        return mockMvc.perform(post(itinerary + "/check").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new CheckItineraryRequest(context))));
    }

    @Test
    void unscheduledAttractionsPreserveBoardOrderAndIncludeEligibleSubAttractions() throws Exception {
        seedItineraryWithBoard(9);
        entityManager.createNativeQuery("UPDATE city SET name = 'Zurich' WHERE id = 1").executeUpdate();
        entityManager.createNativeQuery("UPDATE city SET name = 'Athens' WHERE id = 2").executeUpdate();
        entityManager.createNativeQuery("""
                UPDATE attraction SET city_id = 1 WHERE id IN (3, 4, 6);
                UPDATE attraction SET city_id = 2 WHERE id IN (5, 7);
                UPDATE attraction SET name = 'Closed gate', permanently_closed_at = '2026-08-01' WHERE id = 1;
                UPDATE attraction SET name = 'Zurich zoo' WHERE id = 3;
                UPDATE attraction SET name = 'Arcade', main_attraction_id = 5 WHERE id = 4;
                UPDATE attraction SET name = 'Bistro', category = 'EATERY' WHERE id = 6;
                UPDATE attraction SET city_id = null WHERE id = 8;
                UPDATE trip_attraction SET attraction_group = 'EXCLUDED' WHERE id = 5;
                UPDATE trip_attraction SET attraction_group = 'SECONDARY' WHERE id IN (6, 7, 8);
                UPDATE trip_attraction SET must_visit = false, visit_time = '45-60 min' WHERE id = 4;
                UPDATE trip_attraction SET status = 'VISITED' WHERE id = 7;
                UPDATE trip_attraction SET trip_id = 2 WHERE id = 9;
                """).executeUpdate();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[*].date", contains("2026-09-01", "2026-09-02")))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(3, 4, 2, 6, 7, 8)))
                .andExpect(jsonPath("$.unscheduledAttractions[*].place", contains(
                        "Zurich", "Zurich", "Athens", "Zurich", "Athens", "Keyset region 8")))
                .andExpect(jsonPath("$.unscheduledAttractions[1].name").value("Arcade"))
                .andExpect(jsonPath("$.unscheduledAttractions[1].attractionGroup").value("PRIMARY"))
                .andExpect(jsonPath("$.unscheduledAttractions[1].mustVisit").value(false))
                .andExpect(jsonPath("$.unscheduledAttractions[1].workingHours").value("09:00-17:00"))
                .andExpect(jsonPath("$.unscheduledAttractions[1].visitDuration").value("45-60 min"))
                .andExpect(jsonPath("$.unscheduledAttractions[3].category").value("EATERY"))
                .andExpect(jsonPath("$.unscheduledAttractions[3].attractionGroup").value("SECONDARY"));
    }

    @Test
    void refreshingUnscheduledAttractionsReflectsSavedBoardMovesAndMustVisitChanges() throws Exception {
        seedItineraryWithBoard(4);
        entityManager.createNativeQuery("""
                UPDATE attraction SET city_id = 1 WHERE id IN (2, 3, 4);
                UPDATE trip_attraction SET attraction_group = 'SECONDARY' WHERE id IN (3, 4);
                UPDATE trip_attraction SET must_visit = false WHERE id IN (2, 3);
                """).executeUpdate();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(1, 2, 3, 4)))
                .andExpect(jsonPath("$.unscheduledAttractions[2].attractionGroup").value("SECONDARY"))
                .andExpect(jsonPath("$.unscheduledAttractions[2].mustVisit").value(false));

        mockMvc.perform(put("/trips/1/board/attractions/3").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.PRIMARY, null, 1L))))
                .andExpect(status().isNoContent());
        mockMvc.perform(put("/trips/1/board/attractions/2").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.PRIMARY, null, 3L))))
                .andExpect(status().isNoContent());
        mockMvc.perform(put("/trips/1/attractions/3/must-visit").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new UpdateTripAttractionMustVisitRequest(true))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3, 1, 4)))
                .andExpect(jsonPath("$.unscheduledAttractions[1].attractionGroup").value("PRIMARY"))
                .andExpect(jsonPath("$.unscheduledAttractions[1].mustVisit").value(true));
    }

    @Test
    void extendingAConfirmedItineraryAddsEmptyDatesWithoutMovingItsContents() throws Exception {
        var trip = createTrip("Summer itinerary", "2028-06-10", "2028-06-14");
        var itinerary = trip + "/itinerary";
        addOtherItem(itinerary, "Collect the keys", "2028-06-12", "09:15", 45)
                .andExpect(status().isNoContent());
        saveNote(itinerary + "/days/2028-06-12/note", new UpdateItineraryDayNoteRequest("Bring the booking reference."))
                .andExpect(status().isNoContent());
        var displayed = readItinerary(itinerary).andReturn().getResponse().getContentAsString();
        submitCheck(itinerary, JsonPath.read(displayed, "$.checkContext")).andExpect(status().isNoContent());
        entityManager.clear();
        var checked = readItinerary(itinerary).andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andReturn().getResponse().getContentAsString();
        int keptDay = JsonPath.read(checked, "$.days[2].id");
        int keptEntry = JsonPath.read(checked, "$.days[2].entries[0].entryId");
        String oldContext = JsonPath.read(checked, "$.checkContext");

        saveRange(trip, new UpdateTripRangeRequest(LocalDate.parse("2028-06-10"), LocalDate.parse("2028-06-14")))
                .andExpect(status().isNoContent());
        readItinerary(itinerary).andExpect(content().json(checked));

        var range = new UpdateTripRangeRequest(LocalDate.parse("2028-06-08"), LocalDate.parse("2028-06-16"));
        readRangeImpact(trip, range)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentFromDate").value("2028-06-10"))
                .andExpect(jsonPath("$.currentToDate").value("2028-06-14"))
                .andExpect(jsonPath("$.blockers").isEmpty());
        readItinerary(itinerary).andExpect(content().json(checked));

        saveRange(trip, range).andExpect(status().isNoContent()).andExpect(content().string(""));

        var changed = readItinerary(itinerary)
                .andExpect(jsonPath("$.days[*].date", contains("2028-06-08", "2028-06-09", "2028-06-10", "2028-06-11",
                        "2028-06-12", "2028-06-13", "2028-06-14", "2028-06-15", "2028-06-16")))
                .andExpect(jsonPath("$.days[*].note", contains("Bring the booking reference.")))
                .andExpect(jsonPath("$.days[*].entries[*].entryId", contains(keptEntry)))
                .andExpect(jsonPath("$.days[4].id").value(keptDay))
                .andExpect(jsonPath("$.days[4].entries[0].timing.start").value("2028-06-12T09:15+02:00"))
                .andExpect(jsonPath("$.days[4].entries[0].timing.end").value("2028-06-12T10:00+02:00"))
                .andExpect(jsonPath("$.timeZone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("TRIP_DATES_CHANGED")))
                .andReturn().getResponse().getContentAsString();
        submitCheck(itinerary, oldContext).andExpect(status().isConflict());
        submitCheck(itinerary, JsonPath.read(changed, "$.checkContext")).andExpect(status().isNoContent());
        readItinerary(itinerary)
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void changingTheRangeKeepsOnlyTheNewDatesAndPreservesOverlappingDays() throws Exception {
        createTrip("Moving the trip", "2028-04-01", "2028-04-30");
        var trip = createTrip("Moving the trip", "2028-04-04", "2028-04-06");
        var original = mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        int aprilFourthId = JsonPath.read(original, "$.days[0].id");

        var range = new UpdateTripRangeRequest(LocalDate.of(2028, 4, 3), LocalDate.of(2028, 4, 5));
        mockMvc.perform(put(trip + "/range").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(range)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[*].date", contains("2028-04-03", "2028-04-04", "2028-04-05")))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.timeZone").doesNotExist())
                .andExpect(jsonPath("$.days[1].id").value(aprilFourthId));
        mockMvc.perform(get(trip).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromDate").value("2028-04-03"))
                .andExpect(jsonPath("$.toDate").value("2028-04-05"));
    }

    @Test
    void shorteningRefusesEveryChangeIfARemovedDateHasANoteOrAnEntry() throws Exception {
        var trip = createTrip("Dates with content", "2028-06-10", "2028-06-14");
        var itinerary = trip + "/itinerary";
        var range = new UpdateTripRangeRequest(LocalDate.parse("2028-06-11"), LocalDate.parse("2028-06-13"));
        readRangeImpact(trip, range).andExpect(status().isOk())
                .andExpect(jsonPath("$.blockers").isEmpty());

        saveNote(itinerary + "/days/2028-06-10/note", new UpdateItineraryDayNoteRequest("Return the keys."))
                .andExpect(status().isNoContent());
        addOtherItem(itinerary, "Collect luggage", "2028-06-14", "09:15", 10).andExpect(status().isNoContent());
        var displayed = readItinerary(itinerary).andReturn().getResponse().getContentAsString();
        submitCheck(itinerary, JsonPath.read(displayed, "$.checkContext")).andExpect(status().isNoContent());
        var saved = readItinerary(itinerary).andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andReturn().getResponse().getContentAsString();

        saveRange(trip, range).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "Those dates would remove the day note on 2028-06-10. Keep that date or clear its day note first."));
        readRangeImpact(trip, range).andExpect(status().isOk())
                .andExpect(jsonPath("$.blockers[*].date", contains("2028-06-10", "2028-06-14")))
                .andExpect(jsonPath("$.blockers[*].kind", contains("DAY_NOTE", "ENTRY")))
                .andExpect(jsonPath("$.blockers[*].content", contains("Return the keys.", "Collect luggage")));
        readItinerary(itinerary).andExpect(content().json(saved));
        mockMvc.perform(get(trip).header("x-api-version", "1"))
                .andExpect(jsonPath("$.fromDate").value("2028-06-10"))
                .andExpect(jsonPath("$.toDate").value("2028-06-14"));
    }

    @ParameterizedTest
    @CsvSource({"45, 2028-06-13T23:45+02:00", "60, 2028-06-14T00:00+02:00"})
    void shorteningAllowsRemovingEmptyDatesEvenIfARetainedEntryEndsExactlyAtMidnight(int minutes, String end)
            throws Exception {
        var trip = createTrip("Short summer trip", "2028-06-10", "2028-06-14");
        var itinerary = trip + "/itinerary";
        addOtherItem(itinerary, "Stargazing", "2028-06-13", "23:00", minutes).andExpect(status().isNoContent());
        var displayed = readItinerary(itinerary).andReturn().getResponse().getContentAsString();
        int keptId = JsonPath.read(displayed, "$.days[3].entries[0].entryId");
        var range = new UpdateTripRangeRequest(LocalDate.parse("2028-06-11"), LocalDate.parse("2028-06-13"));

        readRangeImpact(trip, range).andExpect(status().isOk())
                .andExpect(jsonPath("$.blockers").isEmpty());
        saveRange(trip, range).andExpect(status().isNoContent());

        readItinerary(itinerary)
                .andExpect(jsonPath("$.days[*].date", contains("2028-06-11", "2028-06-12", "2028-06-13")))
                .andExpect(jsonPath("$.days[2].entries[0].entryId").value(keptId))
                .andExpect(jsonPath("$.days[2].entries[0].timing.start").value("2028-06-13T23:00+02:00"))
                .andExpect(jsonPath("$.days[2].entries[0].timing.end").value(end))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"));
    }

    @ParameterizedTest
    @CsvSource({"2028-06-11, 2028-06-15", "2028-06-11, 2028-06-16"})
    void movingEitherKindOfNonContainingRangeRequiresAnEmptyItinerary(String from, String to) throws Exception {
        var trip = createTrip("Preserve calendar dates", "2028-06-10", "2028-06-14");
        var itinerary = trip + "/itinerary";
        addOtherItem(itinerary, "Concert", "2028-06-12", "20:00", 60).andExpect(status().isNoContent());
        var saved = readItinerary(itinerary).andReturn().getResponse().getContentAsString();
        var range = new UpdateTripRangeRequest(LocalDate.parse(from), LocalDate.parse(to));

        readRangeImpact(trip, range).andExpect(status().isOk())
                .andExpect(jsonPath("$.shiftBlocked").value(true))
                .andExpect(jsonPath("$.blockers[0].date").value("2028-06-12"))
                .andExpect(jsonPath("$.blockers[0].content").value("Concert"));
        saveRange(trip, range).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "Those dates are not an extension or a shortening. Shifting requires an empty itinerary; review the content on 2028-06-12."));
        readItinerary(itinerary).andExpect(content().json(saved));
    }

    @Test
    void deletingTheTripRemovesItsItinerary() throws Exception {
        var trip = createTrip("Trip to delete", "2028-05-01", "2028-05-01");
        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk());

        mockMvc.perform(delete(trip).header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        var id = trip.substring(trip.lastIndexOf('/') + 1);
        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The requested resource '" + id + "' could not be found. Please refresh and try again."));
    }

    private String createTrip(String name, String from, String to) throws Exception {
        var request = new SaveTripRequest(name, LocalDate.parse(from), LocalDate.parse(to));
        return mockMvc.perform(post("/trips").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader(HttpHeaders.LOCATION);
    }

    private ResultActions addOtherItem(String itinerary, String name, String date, String clock, int minutes) throws Exception {
        var request = new AddItineraryItemRequest(LocalDate.parse(date), null, clock, "Europe/Belgrade",
                ItineraryItemKind.OTHER, new ItineraryItemFields(name, BigDecimal.valueOf(minutes), false, null), null);
        return mockMvc.perform(post(itinerary + "/items").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)));
    }

    private ResultActions readItinerary(String itinerary) throws Exception {
        return mockMvc.perform(get(itinerary).header("x-api-version", "1")).andExpect(status().isOk());
    }

    private ResultActions readRangeImpact(String trip, UpdateTripRangeRequest range) throws Exception {
        return mockMvc.perform(get(trip + "/range/impact").header("x-api-version", "1")
                .param("fromDate", range.fromDate().toString()).param("toDate", range.toDate().toString()));
    }

    private ResultActions saveRange(String trip, UpdateTripRangeRequest range) throws Exception {
        return mockMvc.perform(put(trip + "/range").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(range)));
    }

    private ResultActions schedule(ScheduleAttractionRequest request) throws Exception {
        return mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)));
    }

    private void seedItineraryWithBoard(int size) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, size);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_end_date = DATE '2026-09-02' WHERE id = 1;
                INSERT INTO itinerary(trip_id) VALUES (1);
                INSERT INTO itinerary_day(trip_id, date) VALUES (1, '2026-09-01'), (1, '2026-09-02');
                """).executeUpdate();
    }
}
