package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.Rating;
import com.triptrove.manager.domain.model.TripAttractionGroup;
import com.triptrove.manager.domain.model.TripAttractionStatus;
import com.triptrove.manager.domain.repo.TripRepo;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.Month;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class TripTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TripRepo tripRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    private record InvalidFieldSize(String attractionName, String attractionAddress, String tip, String infoFrom,
                                    String[] errorMessages) {
    }

    @BeforeAll
    static void setup() {
        mapper.registerModule(new JavaTimeModule());
    }

    @Test
    void tripShouldBeReturnedInThreePagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripResponse[] response = mapper.readValue(jsonResponse, GetTripResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].tripName()).isEqualTo("Test trip name 2");
        assertThat(response[0].fromDate()).isEqualTo(LocalDate.of(2025, Month.DECEMBER, 14));
        assertThat(response[0].toDate()).isEqualTo(LocalDate.of(2025, Month.DECEMBER, 17));
        assertThat(response[1].tripName()).isEqualTo("Test trip name 2");
        assertThat(response[1].fromDate()).isEqualTo(LocalDate.of(2025, Month.OCTOBER, 14));
        assertThat(response[1].toDate()).isEqualTo(LocalDate.of(2025, Month.OCTOBER, 19));

        jsonResponse = mockMvc.perform(get("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("tripId", response[1].tripId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetTripResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].tripName()).isEqualTo("Test trip name 2");
        assertThat(response[0].fromDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 10));
        assertThat(response[0].toDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 19));
        assertThat(response[1].tripName()).isEqualTo("Test trip name 3");
        assertThat(response[1].toDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 23));
        assertThat(response[1].fromDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 12));

        jsonResponse = mockMvc.perform(get("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("tripId", response[1].tripId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetTripResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].tripName()).isEqualTo("Test trip name 1");
        assertThat(response[0].toDate()).isEqualTo(LocalDate.of(2024, Month.SEPTEMBER, 2));
        assertThat(response[0].fromDate()).isEqualTo(LocalDate.of(2024, Month.AUGUST, 20));
    }

    @Test
    void tripShouldBeReturnedInThreePagesInAscendingOrderWhenASCOrderIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips")
                        .param("sd", "ASC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripResponse[] response = mapper.readValue(jsonResponse, GetTripResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].tripName()).isEqualTo("Test trip name 1");
        assertThat(response[0].toDate()).isEqualTo(LocalDate.of(2024, Month.SEPTEMBER, 2));
        assertThat(response[0].fromDate()).isEqualTo(LocalDate.of(2024, Month.AUGUST, 20));
        assertThat(response[1].tripName()).isEqualTo("Test trip name 3");
        assertThat(response[1].toDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 23));
        assertThat(response[1].fromDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 12));


        jsonResponse = mockMvc.perform(get("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("tripId", response[1].tripId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetTripResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].tripName()).isEqualTo("Test trip name 2");
        assertThat(response[0].fromDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 10));
        assertThat(response[0].toDate()).isEqualTo(LocalDate.of(2025, Month.SEPTEMBER, 19));
        assertThat(response[1].tripName()).isEqualTo("Test trip name 2");
        assertThat(response[1].fromDate()).isEqualTo(LocalDate.of(2025, Month.OCTOBER, 14));
        assertThat(response[1].toDate()).isEqualTo(LocalDate.of(2025, Month.OCTOBER, 19));

        jsonResponse = mockMvc.perform(get("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("tripId", response[1].tripId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetTripResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].tripName()).isEqualTo("Test trip name 2");
        assertThat(response[0].fromDate()).isEqualTo(LocalDate.of(2025, Month.DECEMBER, 14));
        assertThat(response[0].toDate()).isEqualTo(LocalDate.of(2025, Month.DECEMBER, 17));
    }

    @Test
    void tripShouldBeSuccessfullySavedWhenNameAndRangeIsNotPresent() throws Exception {
        String tripName = "Test trip name";
        var request = new SaveTripRequest(tripName, LocalDate.now().minusDays(10), LocalDate.now());

        mockMvc.perform(post("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/trips/" + tripRepo.findByName(tripName).getFirst().getId()));

        assertThat(tripRepo.findByName(tripName).getFirst().getName()).isEqualTo(tripName);
    }

    @Test
    void tripShouldBeSuccessfullySavedWhenNameIsAlreadyPresentButUnderDifferentRange() throws Exception {
        String tripName = "Test trip name 1";
        var request = new SaveTripRequest(tripName, LocalDate.now().minusDays(10), LocalDate.now());

        mockMvc.perform(post("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/trips/" + tripRepo.findByName(tripName).getLast().getId()));

        assertThat(tripRepo.findByName(tripName).getLast().getName()).isEqualTo(tripName);
    }

    @Test
    void tripShouldNotBeSavedWhenNameAndRangeOverlapWithAlreadyAddedTrip() throws Exception {
        String tripName = "Test trip name 1";
        var request = new SaveTripRequest(tripName, LocalDate.of(2024, Month.SEPTEMBER, 1), LocalDate.of(2024, Month.SEPTEMBER, 8));

        var jsonResponse = mockMvc.perform(post("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
        assertThat(actual.errorMessage()).isEqualTo("The given name is not valid as it already exists");
    }

    private record InvalidTripData(String tripName, LocalDate fromDate, LocalDate toDate, String[] errorMessages) {
    }

    @ParameterizedTest
    @MethodSource({"provideInvalidTripName", "provideInvalidTripRangeData"})
    void tripShouldNotBeSavedWhenTripDetailsAreIncorrect(InvalidTripData input) throws Exception {
        var request = new SaveTripRequest(input.tripName, input.fromDate, input.toDate);

        var jsonResponse = mockMvc.perform(post("/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1)).isEqualTo(input.errorMessages()[0]);
    }

    @Test
    void shouldReturnTripWhenGivenIdIsPresent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripResponse response = mapper.readValue(jsonResponse, GetTripResponse.class);
        assertThat(response.tripName()).isEqualTo("Test trip name 1");
        assertThat(response.fromDate()).isEqualTo(LocalDate.of(2024, Month.AUGUST, 20));
        assertThat(response.toDate()).isEqualTo(LocalDate.of(2024, Month.SEPTEMBER, 2));
    }

    @Test
    void shouldReturnNotFoundWhenGivenIdIsNotPresent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/" + 100)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldUpdateTripNameWhenNewNameUnderPresentedRangeIsNotPresent() throws Exception {
        String tripName = "Test trip name 2";
        var request = new UpdateTripNameRequest(tripName);

        mockMvc.perform(put("/trips/" + 1 + "/name")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(tripRepo.findByName(tripName).getFirst().getName()).isEqualTo(tripName);
    }

    @Test
    void shouldNotUpdateTripNameWhenTripIdIsUnknown() throws Exception {
        String tripName = "Test trip name 2";
        var request = new UpdateTripNameRequest(tripName);

        var jsonResponse = mockMvc.perform(put("/trips/" + 100 + "/name")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidTripName")
    void shouldNotUpdateTripNameWhenTripNameIsIncorrect(InvalidTripData input) throws Exception {
        var request = new UpdateTripNameRequest(input.tripName);

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/name")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1)).isEqualTo(input.errorMessages()[0]);
    }

    private static Stream<Arguments> provideInvalidTripName() {
        String[] emptyStringMessage = {"tripName = Trip name may not be null or empty"};
        String[] tooLongNameMessage = {"tripName = Trip name may not be longer then 512"};

        return Stream.of(
                arguments(Named.of("null name", new InvalidTripData(null, LocalDate.of(2024, Month.SEPTEMBER, 1), LocalDate.of(2024, Month.SEPTEMBER, 8), emptyStringMessage))),
                arguments(Named.of("empty name", new InvalidTripData("", LocalDate.of(2024, Month.SEPTEMBER, 1), LocalDate.of(2024, Month.SEPTEMBER, 8), emptyStringMessage))),
                arguments(Named.of("blank name", new InvalidTripData("      ", LocalDate.of(2024, Month.SEPTEMBER, 1), LocalDate.of(2024, Month.SEPTEMBER, 8), emptyStringMessage))),
                arguments(Named.of("Too long name", new InvalidTripData("abcd".repeat(128) + "e", LocalDate.of(2024, Month.SEPTEMBER, 1), LocalDate.of(2024, Month.SEPTEMBER, 8), tooLongNameMessage)))
        );
    }

    @Test
    void shouldPreventUpdatingTripNameWhenNewTripNameAlreadyExistsUnderGivenRange() throws Exception {
        String tripName = "Test trip name 2";
        var request = new UpdateTripNameRequest(tripName);

        var jsonResponse = mockMvc.perform(put("/trips/" + 3 + "/name")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
    }

    @Test
    void shouldUpdateTripRangeWhenNewRangeDoesNotOverlapWithSameNamedRanges() throws Exception {
        LocalDate fromDate = LocalDate.now().minusDays(10);
        LocalDate toDate = LocalDate.now().minusDays(2);
        var request = new UpdateTripRangeRequest(fromDate, toDate);

        mockMvc.perform(put("/trips/" + 1 + "/range")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(tripRepo.findById(1L).get().getFrom()).isEqualTo(fromDate);
        assertThat(tripRepo.findById(1L).get().getTo()).isEqualTo(toDate);
    }

    @Test
    void shouldNotUpdateTripRangeWhenTripIdIsUnknown() throws Exception {
        LocalDate fromDate = LocalDate.now().minusDays(10);
        LocalDate toDate = LocalDate.now().minusDays(2);
        var request = new UpdateTripRangeRequest(fromDate, toDate);

        var jsonResponse = mockMvc.perform(put("/trips/" + 100 + "/range")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldNotUpdateTripRangeWhenNewRangeOverlapsWithSameNamedRanges() throws Exception {
        LocalDate fromDate = LocalDate.of(2025, Month.OCTOBER, 19);
        LocalDate toDate = LocalDate.of(2025, Month.OCTOBER, 21);
        var request = new UpdateTripRangeRequest(fromDate, toDate);

        var jsonResponse = mockMvc.perform(put("/trips/" + 3 + "/range")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidTripRangeData")
    void shouldNotUpdateTripRangeWhenNewRangeIsInvalid(InvalidTripData input) throws Exception {
        var request = new UpdateTripRangeRequest(input.fromDate, input.toDate);

        var jsonResponse = mockMvc.perform(put("/trips/" + 2 + "/range")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1)).isEqualTo(input.errorMessages()[0]);
    }

    private static Stream<Arguments> provideInvalidTripRangeData() {
        String[] fromDateNullMessage = {"fromDate = must not be null"};
        String[] toDateNullMessage = {"toDate = must not be null"};
        String[] toDateBeforeFromDateMessage = {"fromDateNotAfterToDate = fromDate must be on or before toDate"};
        String[] dateToEarlyInPastMessage = {"datesNotBefore1960 = Dates must not be before 1960-01-01"};

        return Stream.of(
                arguments(Named.of("null from date", new InvalidTripData("Test trip name", null, LocalDate.of(2024, Month.SEPTEMBER, 8), fromDateNullMessage))),
                arguments(Named.of("null to date", new InvalidTripData("Test trip name", LocalDate.of(2024, Month.SEPTEMBER, 1), null, toDateNullMessage))),
                arguments(Named.of("from date is too far in the past", new InvalidTripData("Test trip name", LocalDate.of(1959, Month.SEPTEMBER, 1), LocalDate.of(1960, Month.JANUARY, 1), dateToEarlyInPastMessage))),
                arguments(Named.of("from date is after to date", new InvalidTripData("Test trip name", LocalDate.of(2024, Month.SEPTEMBER, 10), LocalDate.of(2024, Month.JANUARY, 1), toDateBeforeFromDateMessage)))
        );
    }

    @Test
    void shouldDeleteTripWhenAllConditionsAreSatisfied() throws Exception {
        assertThat(tripRepo.findById(2L)).isNotEmpty();

        mockMvc.perform(delete("/trips/" + 3)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(tripRepo.findById(3L)).isEmpty();
    }

    @Test
    void shouldNotDeleteTripWhenTripIdIsUnknown() throws Exception {
        assertThat(tripRepo.findById(2L)).isNotEmpty();

        var jsonResponse = mockMvc.perform(delete("/trips/" + 100)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldNotDeleteTripWhenTripHasAttractionUnder() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/trips/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.CASCADE_DELETE_ERROR);
    }

    @Test
    void attractionShouldBeAddedUnderTripWhenValidRequestIsSent() throws Exception {
        var request = new AddAttractionUnderTripRequest(4L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(4);
        assertThat(tripRepo.findById(1L).get().getAttractions().getLast().getAttraction().getId()).isEqualTo(4);
        assertThat(tripRepo.findById(1L).get().getAttractions().getLast().getStatus()).isEqualTo(TripAttractionStatus.PLANNED);
        assertThat(tripRepo.findById(1L).get().getAttractions().getLast().getNote()).isNull();
        assertThat(tripRepo.findById(1L).get().getAttractions().getLast().getRating()).isNull();
        assertThat(tripRepo.findById(1L).get().getAttractions().getLast().isMustVisit()).isEqualTo(false);
    }

    @Test
    void shouldInheritMustVisitFromAttractionWhenAttractionIsAddedUnderTrip() throws Exception {
        var request = new AddAttractionUnderTripRequest(5L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().getLast();
        assertThat(tripAttraction.getAttraction().getId()).isEqualTo(5);
        assertThat(tripAttraction.isMustVisit()).isEqualTo(true);
    }

    @Test
    void shouldReturnMustVisitInResponseWhenAttractionIsAddedUnderTrip() throws Exception {
        var addRequest = new AddAttractionUnderTripRequest(5L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(addRequest)))
                .andExpect(status().isNoContent());

        var jsonResponse = mockMvc.perform(get("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripAttractionResponse[] response = mapper.readValue(jsonResponse, GetTripAttractionResponse[].class);
        var added = java.util.Arrays.stream(response)
                .filter(r -> r.attractionId().equals(5L))
                .findFirst().orElseThrow();
        assertThat(added.mustVisit()).isTrue();
    }

    @Test
    void mustVisitShouldNotChangeWhenAttractionMustVisitIsUpdatedAfterBeingAdded() throws Exception {
        var addRequest = new AddAttractionUnderTripRequest(5L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(addRequest)))
                .andExpect(status().isNoContent());

        // Update must visit to false on the trip attraction
        var updateRequest = new UpdateTripAttractionMustVisitRequest(false);

        mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 5 + "/must-visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(5L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.isMustVisit()).isFalse();
        // The base attraction should remain unchanged
        assertThat(tripAttraction.getAttraction().isMustVisit()).isTrue();
    }

    @Test
    void shouldInheritNoteFromAttractionTipWhenAttractionIsAddedUnderTrip() throws Exception {
        var request = new AddAttractionUnderTripRequest(1L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 3 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(3L).get().getAttractions().getLast();
        assertThat(tripAttraction.getAttraction().getId()).isEqualTo(1);
        assertThat(tripAttraction.getNote()).isEqualTo("Test tip");
    }

    @Test
    void shouldReturnNoteInResponseWhenAttractionIsAddedUnderTrip() throws Exception {
        var addRequest = new AddAttractionUnderTripRequest(1L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 3 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(addRequest)))
                .andExpect(status().isNoContent());

        var jsonResponse = mockMvc.perform(get("/trips/" + 3 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripAttractionResponse[] response = mapper.readValue(jsonResponse, GetTripAttractionResponse[].class);
        var added = java.util.Arrays.stream(response)
                .filter(r -> r.attractionId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(added.note()).isEqualTo("Test tip");
    }

    @Test
    void noteShouldNotChangeAttractionTipWhenNoteIsUpdatedAfterBeingAdded() throws Exception {
        var addRequest = new AddAttractionUnderTripRequest(1L, TripAttractionGroupDTO.PRIMARY);

        mockMvc.perform(post("/trips/" + 3 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(addRequest)))
                .andExpect(status().isNoContent());

        // Update note on the trip attraction
        var updateRequest = new UpdateTripAttractionNoteRequest("Custom note");

        mockMvc.perform(put("/trips/" + 3 + "/attractions/" + 1 + "/note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(3L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getNote()).isEqualTo("Custom note");
        // The base attraction tip should remain unchanged
        assertThat(tripAttraction.getAttraction().getTip().orElse(null)).isEqualTo("Test tip");
    }

    @ParameterizedTest
    @MethodSource("provideValidMustVisitValues")
    void mustVisitShouldBeUpdatedWhenValidValueIsProvided(Boolean mustVisit) throws Exception {
        var request = new UpdateTripAttractionMustVisitRequest(mustVisit);

        mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/must-visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.isMustVisit()).isEqualTo(mustVisit);
    }

    private static Stream<Arguments> provideValidMustVisitValues() {
        return Stream.of(
                arguments(Named.of("must visit set to true", true)),
                arguments(Named.of("must visit set to false", false))
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidMustVisitTargets")
    void mustVisitShouldNotBeUpdatedWhenTripOrAttractionIsNotFound(InvalidReviewTarget input) throws Exception {
        var request = new UpdateTripAttractionMustVisitRequest(false);

        var jsonResponse = mockMvc.perform(put("/trips/" + input.tripId + "/attractions/" + input.attractionId + "/must-visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    private static Stream<Arguments> provideInvalidMustVisitTargets() {
        return Stream.of(
                arguments(Named.of("non-existent trip", new InvalidReviewTarget(100L, 1L))),
                arguments(Named.of("attraction not under trip", new InvalidReviewTarget(1L, 4L)))
        );
    }

    @Test
    void mustVisitShouldNotBeUpdatedWhenValueIsNull() throws Exception {
        var request = new UpdateTripAttractionMustVisitRequest(null);

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/must-visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidWorkingHoursTargets")
    void workingHoursShouldNotBeUpdatedWhenTripOrAttractionIsNotFound(InvalidReviewTarget input) throws Exception {
        var request = new UpdateTripAttractionWorkingHoursRequest("9-17");

        var jsonResponse = mockMvc.perform(put("/trips/" + input.tripId + "/attractions/" + input.attractionId + "/working-hours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    private static Stream<Arguments> provideInvalidWorkingHoursTargets() {
        return Stream.of(
                arguments(Named.of("non-existent trip", new InvalidReviewTarget(100L, 1L))),
                arguments(Named.of("attraction not under trip", new InvalidReviewTarget(1L, 4L)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideValidWorkingHoursValues")
    void workingHoursShouldBeUpdatedWhenValidValueIsProvided(String workingHours) throws Exception {
        var request = new UpdateTripAttractionWorkingHoursRequest(workingHours);

        mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/working-hours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getWorkingHours()).isEqualTo(workingHours);
    }

    private static Stream<Arguments> provideValidWorkingHoursValues() {
        return Stream.of(
                arguments(Named.of("presented working hours", "9-17")),
                arguments(Named.of("null working hours", (String) null))
        );
    }

    @Test
    void workingHoursShouldNotBeUpdatedWhenValueIsTooLong() throws Exception {
        var request = new UpdateTripAttractionWorkingHoursRequest("a".repeat(129));

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/working-hours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual2 = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual2.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @ParameterizedTest
    @MethodSource("provideValidVisitTimeValues")
    void visitTimeShouldBeUpdatedWhenValidValueIsProvided(String visitTime) throws Exception {
        var request = new UpdateTripAttractionVisitTimeRequest(visitTime);

        mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/visit-time")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getVisitTime()).isEqualTo(visitTime);
    }

    private static Stream<Arguments> provideValidVisitTimeValues() {
        return Stream.of(
                arguments(Named.of("valid visit time", "2 hours")),
                arguments(Named.of("null visit time", (String) null))
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidVisitTimeTargets")
    void visitTimeShouldNotBeUpdatedWhenTripOrAttractionIsNotFound(InvalidReviewTarget input) throws Exception {
        var request = new UpdateTripAttractionVisitTimeRequest("2 hours");

        var jsonResponse = mockMvc.perform(put("/trips/" + input.tripId + "/attractions/" + input.attractionId + "/visit-time")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    private static Stream<Arguments> provideInvalidVisitTimeTargets() {
        return Stream.of(
                arguments(Named.of("non-existent trip", new InvalidReviewTarget(100L, 1L))),
                arguments(Named.of("attraction not under trip", new InvalidReviewTarget(1L, 4L)))
        );
    }

    @Test
    void visitTimeShouldNotBeUpdatedWhenValueIsTooLong() throws Exception {
        var request = new UpdateTripAttractionVisitTimeRequest("a".repeat(65));

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/visit-time")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @ParameterizedTest
    @MethodSource("provideValidNoteValues")
    void noteShouldBeUpdatedWhenValidValueIsProvided(String note) throws Exception {
        var request = new UpdateTripAttractionNoteRequest(note);

        mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getNote()).isEqualTo(note);
    }

    private static Stream<Arguments> provideValidNoteValues() {
        return Stream.of(
                arguments(Named.of("valid note", "Visit in the morning")),
                arguments(Named.of("null note", (String) null))
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidNoteTargets")
    void noteShouldNotBeUpdatedWhenTripOrAttractionIsNotFound(InvalidReviewTarget input) throws Exception {
        var request = new UpdateTripAttractionNoteRequest("Visit in the morning");

        var jsonResponse = mockMvc.perform(put("/trips/" + input.tripId + "/attractions/" + input.attractionId + "/note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    private static Stream<Arguments> provideInvalidNoteTargets() {
        return Stream.of(
                arguments(Named.of("non-existent trip", new InvalidReviewTarget(100L, 1L))),
                arguments(Named.of("attraction not under trip", new InvalidReviewTarget(1L, 4L)))
        );
    }

    @Test
    void noteShouldNotBeUpdatedWhenValueIsTooLong() throws Exception {
        var request = new UpdateTripAttractionNoteRequest("a".repeat(513));

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @Test
    void attractionShouldNotBeAddedUnderTripWhenInvalidTripIdIsSent() throws Exception {
        var request = new AddAttractionUnderTripRequest(4L, TripAttractionGroupDTO.PRIMARY);

        var jsonResponse = mockMvc.perform(post("/trips/" + 100 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
        assertThat(actual.errorMessage()).isEqualTo("The specified element could not be found");
    }

    @Test
    void attractionShouldNotBeAddedUnderTripWhenInvalidAttractionIdIsSent() throws Exception {
        var request = new AddAttractionUnderTripRequest(100L, TripAttractionGroupDTO.PRIMARY);

        var jsonResponse = mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
        assertThat(actual.errorMessage()).isEqualTo("The specified element could not be found");
    }

    @Test
    void attractionShouldNotBeAddedUnderTripWhenItsAlreadyThere() throws Exception {
        var request = new AddAttractionUnderTripRequest(1L, TripAttractionGroupDTO.PRIMARY);

        var jsonResponse = mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.ATTRACTION_ALREADY_ADDED_TO_TRIP);
        assertThat(actual.errorMessage()).isEqualTo("This attraction has already been added to the trip");
    }

    @Test
    void attractionShouldBeReviewedUnderTripWhenValidRequestIsSent() throws Exception {
        String updatedNote = "Updated note";
        var request = new ReviewTripAttractionRequest(RatingDTO.VERY_GOOD, updatedNote);

        mockMvc.perform(post("/trips/" + 1 + "/attractions/" + 1 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getRating()).isEqualTo(Rating.VERY_GOOD);
        assertThat(tripAttraction.getReviewNote()).isEqualTo(updatedNote);
        assertThat(tripAttraction.getStatus()).isEqualTo(TripAttractionStatus.VISITED);
    }

    @Test
    void attractionShouldNotBeReviewedWhenTooLongNoteIsGiven() throws Exception {
        var request = new ReviewTripAttractionRequest(RatingDTO.EXCELLENT, "abcd".repeat(128) + "e");

        var jsonResponse = mockMvc.perform(post("/trips/" + 1 + "/attractions/" + 1 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{reviewNote = Review note may not be longer then 512}");
    }

    @Test
    void attractionShouldBeDeletedFromTripWhenValidRequestIsSent() throws Exception {
        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(3);

        mockMvc.perform(delete("/trips/" + 1 + "/attractions/" + 3)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(2);
        assertThat(tripRepo.findById(1L).get().getAttractions().getLast().getAttraction().getId()).isEqualTo(2);
    }

    @Test
    void attractionShouldNotBeDeletedFromTripWhenAttractionIdDoestExist() throws Exception {
        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(3);

        var jsonResponse = mockMvc.perform(delete("/trips/" + 1 + "/attractions/" + 10)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(3);
        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
        assertThat(actual.errorMessage()).isEqualTo("The specified element could not be found");
    }

    @ParameterizedTest
    @MethodSource("provideAllAttractionGroups")
    void attractionShouldBeAddedWithCorrectGroupWhenGroupIsProvided(TripAttractionGroupDTO group) throws Exception {
        var request = new AddAttractionUnderTripRequest(4L, group);

        mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().getLast();
        assertThat(tripAttraction.getAttraction().getId()).isEqualTo(4);
        assertThat(tripAttraction.getStatus()).isEqualTo(TripAttractionStatus.PLANNED);
        assertThat(tripAttraction.getAttractionGroup()).isEqualTo(TripAttractionGroup.valueOf(group.name()));
        assertThat(tripAttraction.getRating()).isNull();
        assertThat(tripAttraction.getNote()).isNull();
        assertThat(tripAttraction.getReviewNote()).isNull();
    }

    private static Stream<Arguments> provideAllAttractionGroups() {
        return Stream.of(
                arguments(Named.of("PRIMARY group", TripAttractionGroupDTO.PRIMARY)),
                arguments(Named.of("SECONDARY group", TripAttractionGroupDTO.SECONDARY)),
                arguments(Named.of("EXCLUDED group", TripAttractionGroupDTO.EXCLUDED))
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidAddAttractionRequests")
    void attractionShouldNotBeAddedWhenRequiredFieldsAreMissing(AddAttractionUnderTripRequest request) throws Exception {
        var jsonResponse = mockMvc.perform(post("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    private static Stream<Arguments> provideInvalidAddAttractionRequests() {
        return Stream.of(
                arguments(Named.of("null attractionId", new AddAttractionUnderTripRequest(null, TripAttractionGroupDTO.PRIMARY))),
                arguments(Named.of("null attractionGroup", new AddAttractionUnderTripRequest(4L, null)))
        );
    }

    @Test
    void attractionNoteShouldBeClearedWhenReviewedWithNullNote() throws Exception {
        var request = new ReviewTripAttractionRequest(RatingDTO.DISLIKED, null);

        mockMvc.perform(post("/trips/" + 1 + "/attractions/" + 3 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(3L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getRating()).isEqualTo(Rating.DISLIKED);
        assertThat(tripAttraction.getReviewNote()).isNull();
    }

    @Test
    void attractionShouldNotBeReviewedWhenRatingIsNull() throws Exception {
        var request = new ReviewTripAttractionRequest(null, "Some note");

        var jsonResponse = mockMvc.perform(post("/trips/" + 1 + "/attractions/" + 1 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    private record InvalidReviewTarget(Long tripId, Long attractionId) {
    }

    @ParameterizedTest
    @MethodSource("provideInvalidReviewTargets")
    void attractionShouldNotBeReviewedWhenTripOrAttractionIsNotFound(InvalidReviewTarget input) throws Exception {
        var request = new ReviewTripAttractionRequest(RatingDTO.VERY_GOOD, "Some note");

        var jsonResponse = mockMvc.perform(post("/trips/" + input.tripId + "/attractions/" + input.attractionId + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    private static Stream<Arguments> provideInvalidReviewTargets() {
        return Stream.of(
                arguments(Named.of("non-existent trip", new InvalidReviewTarget(100L, 1L))),
                arguments(Named.of("attraction not under trip", new InvalidReviewTarget(1L, 4L)))
        );
    }

    @Test
    void reviewNoteShouldNotAffectAttractionNoteWhenAttractionIsReviewed() throws Exception {
        var request = new ReviewTripAttractionRequest(RatingDTO.EXCELLENT, "Amazing place");

        mockMvc.perform(post("/trips/" + 1 + "/attractions/" + 3 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(3L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getReviewNote()).isEqualTo("Amazing place");
        assertThat(tripAttraction.getNote()).isEqualTo("test note");
    }

    @Test
    void reviewNoteShouldBeReturnedInResponseWhenAttractionHasBeenReviewed() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/" + 2 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripAttractionResponse[] response = mapper.readValue(jsonResponse, GetTripAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionId()).isEqualTo(1);
        assertThat(response[0].status()).isEqualTo(TripAttractionStatusDTO.VISITED);
        assertThat(response[0].rating()).isEqualTo(RatingDTO.VERY_GOOD);
        assertThat(response[0].reviewNote()).isEqualTo("Great experience");
    }
    
    @Test
    void clearReviewShouldKeepAttractionInTrip() throws Exception {
        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(3);

        mockMvc.perform(delete("/trips/" + 1 + "/attractions/" + 1 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(tripRepo.findById(1L).get().getAttractions()).hasSize(3);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidReviewTargets")
    void clearReviewShouldReturnNotFoundWhenTripOrAttractionDoesNotExist(InvalidReviewTarget input) throws Exception {
        var jsonResponse = mockMvc.perform(delete("/trips/" + input.tripId + "/attractions/" + input.attractionId + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void attractionShouldNotBeDeletedFromTripWhenTripIdDoesNotExist() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/trips/" + 100 + "/attractions/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldReturnAllAttractionsWhenTripHasAttractions() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/" + 1 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripAttractionResponse[] response = mapper.readValue(jsonResponse, GetTripAttractionResponse[].class);
        assertThat(response).hasSize(3);
        assertThat(response[0].attractionId()).isEqualTo(1);
        assertThat(response[0].status()).isEqualTo(TripAttractionStatusDTO.PLANNED);
        assertThat(response[0].rating()).isEqualTo(RatingDTO.EXCELLENT);
        assertThat(response[0].note()).isNull();
        assertThat(response[0].reviewNote()).isNull();
        assertThat(response[1].attractionId()).isEqualTo(2);
        assertThat(response[1].status()).isEqualTo(TripAttractionStatusDTO.PLANNED);
        assertThat(response[1].rating()).isEqualTo(RatingDTO.AVERAGE);
        assertThat(response[1].note()).isNull();
        assertThat(response[1].reviewNote()).isNull();
        assertThat(response[2].attractionId()).isEqualTo(3);
        assertThat(response[2].status()).isEqualTo(TripAttractionStatusDTO.PLANNED);
        assertThat(response[2].rating()).isEqualTo(RatingDTO.EXCELLENT);
        assertThat(response[2].note()).isEqualTo("test note");
        assertThat(response[2].reviewNote()).isNull();
    }

    @Test
    void shouldReturnEmptyListWhenTripHasNoAttractions() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/" + 3 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetTripAttractionResponse[] response = mapper.readValue(jsonResponse, GetTripAttractionResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    void shouldReturnNotFoundWhenGettingAttractionsForNonExistentTrip() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/" + 100 + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void countriesSummaryShouldCountAllCountriesWhenAtLeastOneMustVisitAttractionIsVisited() throws Exception {
        var jsonResponse = mockMvc.perform(get("/trips/countries/summary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountriesSummaryResponse response = mapper.readValue(jsonResponse, GetCountriesSummaryResponse.class);
        assertThat(response.visitedCount()).isEqualTo(1);
        assertThat(response.totalCount()).isEqualTo(195);
    }

    @Test
    void countriesSummaryShouldCountOnlyCountriesWhenAtLeastOneMustVisitAttractionIsVisited() throws Exception {
        tripRepo.deleteTripAttraction(2L, 1L);

        var jsonResponse = mockMvc.perform(get("/trips/countries/summary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountriesSummaryResponse response = mapper.readValue(jsonResponse, GetCountriesSummaryResponse.class);
        assertThat(response.visitedCount()).isEqualTo(0);
        assertThat(response.totalCount()).isEqualTo(195);
    }

    @ParameterizedTest
    @MethodSource("provideAllAttractionGroupsForUpdate")
    void attractionGroupShouldBeUpdatedWhenValidGroupIsProvided(TripAttractionGroupDTO group) throws Exception {
        var request = new UpdateAttractionGroupRequest(group);

        mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var tripAttraction = tripRepo.findById(1L).get().getAttractions().stream()
                .filter(ta -> ta.getAttraction().getId().equals(1L))
                .findFirst().orElseThrow();
        assertThat(tripAttraction.getAttractionGroup()).isEqualTo(TripAttractionGroup.valueOf(group.name()));
    }

    private static Stream<Arguments> provideAllAttractionGroupsForUpdate() {
        return Stream.of(
                arguments(Named.of("PRIMARY group", TripAttractionGroupDTO.PRIMARY)),
                arguments(Named.of("SECONDARY group", TripAttractionGroupDTO.SECONDARY)),
                arguments(Named.of("EXCLUDED group", TripAttractionGroupDTO.EXCLUDED))
        );
    }

    @Test
    void attractionGroupShouldNotBeUpdatedWhenTripIdDoesNotExist() throws Exception {
        var request = new UpdateAttractionGroupRequest(TripAttractionGroupDTO.SECONDARY);

        var jsonResponse = mockMvc.perform(put("/trips/" + 100 + "/attractions/" + 1 + "/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void attractionGroupShouldNotBeUpdatedWhenAttractionIsNotUnderTrip() throws Exception {
        var request = new UpdateAttractionGroupRequest(TripAttractionGroupDTO.SECONDARY);

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 4 + "/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void attractionGroupShouldNotBeUpdatedWhenGroupIsNull() throws Exception {
        var request = new UpdateAttractionGroupRequest(null);

        var jsonResponse = mockMvc.perform(put("/trips/" + 1 + "/attractions/" + 1 + "/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

}