package com.triptrove.manager;

import com.jayway.jsonpath.JsonPath;
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

import java.util.List;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class ItineraryTest extends AbstractIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @ParameterizedTest
    @MethodSource("newTrips")
    void aNewTripHasOneItineraryDayPerInclusiveDate(String from, String to, List<String> dates) throws Exception {
        var trip = createTrip("Winter trip", from, to);

        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[*].date", contains(dates.toArray(String[]::new))))
                .andExpect(jsonPath("$.initialZone").doesNotExist())
                .andExpect(jsonPath("$.lastCheckedAt").doesNotExist());
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
                UPDATE itinerary SET initial_zone = 'Europe/Belgrade', last_checked_at = '2028-01-30T09:00:00Z'
                WHERE trip_id = :tripId
                """).setParameter("tripId", tripId).executeUpdate();

        mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(tripId))
                .andExpect(jsonPath("$.initialZone").value("Europe/Belgrade"))
                .andExpect(jsonPath("$.lastCheckedAt").value("2028-01-30T09:00:00Z"));
    }

    @Test
    void changingTheRangeKeepsOnlyTheNewDatesAndPreservesOverlappingDays() throws Exception {
        createTrip("Moving the trip", "2028-04-01", "2028-04-30");
        var trip = createTrip("Moving the trip", "2028-04-04", "2028-04-06");
        var original = mockMvc.perform(get(trip + "/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        int aprilFourthId = JsonPath.read(original, "$.days[0].id");

        mockMvc.perform(put(trip + "/range").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fromDate": "2028-04-03", "toDate": "2028-04-05"}
                                """))
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
        return mockMvc.perform(post("/trips").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tripName": "%s", "fromDate": "%s", "toDate": "%s"}
                                """.formatted(name, from, to)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader(HttpHeaders.LOCATION);
    }
}
