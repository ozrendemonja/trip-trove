package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetTripResponse;
import com.triptrove.manager.application.dto.SaveTripRequest;
import com.triptrove.manager.application.dto.UpdateTripNameRequest;
import com.triptrove.manager.application.dto.UpdateTripRangeRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
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

        var jsonResponse = mockMvc.perform(put("/trips/" + 2 + "/range")
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
}
