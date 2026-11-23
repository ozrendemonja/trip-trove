package com.triptrove.manager;

import com.jayway.jsonpath.JsonPath;
import com.triptrove.manager.application.dto.MoveAttractionOnBoardRequest;
import com.triptrove.manager.application.dto.SaveTripRequest;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.TripAttractionGroupDTO;
import com.triptrove.manager.application.dto.UpdateTripAttractionMustVisitRequest;
import com.triptrove.manager.application.dto.UpdateTripRangeRequest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.json.JsonMapper;

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
    void anExplicitCheckCanRecordAnEmptyItinerary() throws Exception {
        var itinerary = createTrip("Checking an empty itinerary", "2028-02-01", "2028-02-01") + "/itinerary";
        mockMvc.perform(get(itinerary).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.lastCheckedAt").doesNotExist());

        mockMvc.perform(post(itinerary + "/check").header("x-api-version", "1"))
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
    }

    @Test
    void checkingAnUnknownItineraryReturnsNotFound() throws Exception {
        mockMvc.perform(post("/trips/9223372036854775807/itinerary/check").header("x-api-version", "1"))
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
        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());

        var check = post("/trips/1/itinerary/check").header("x-api-version", "1");
        mockMvc.perform(check).andExpect(status().isNoContent());
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

        mockMvc.perform(check).andExpect(status().isNoContent());
        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.lastCheckedAt").value(not(checkTime)))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[*].attractionId", contains(1, 3)))
                .andExpect(jsonPath("$.days[1].entries[*].attractionId", contains(2)));
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
                .andExpect(jsonPath("$.days[1].id").value(aprilFourthId));
        mockMvc.perform(get(trip).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromDate").value("2028-04-03"))
                .andExpect(jsonPath("$.toDate").value("2028-04-05"));
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
