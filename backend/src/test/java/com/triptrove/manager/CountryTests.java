package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetCountryResponse;
import com.triptrove.manager.application.dto.SaveCountryRequest;
import com.triptrove.manager.application.dto.UpdateCountryContinentRequest;
import com.triptrove.manager.application.dto.UpdateCountryDetailsRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class CountryTests extends AbstractIntegrationTest {
    private static final String CONTINENT_NAME_0 = "Test continent 0";
    private static final String CONTINENT_NAME_1 = "Test continent 1";

    private final static ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @BeforeAll
    static void setup() {
        mapper.registerModule(new JavaTimeModule());
    }

    @ParameterizedTest
    @MethodSource("provideValidCountryNames")
    void countryShouldBeSavedWhenValidNameIsSent(String countryName) throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, countryName);

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/countries/" + countryRepo.findByName(countryName).getFirst().getId()));

        assertThat(countryRepo.findByName(countryName).getFirst().getName()).isEqualTo(countryName);
    }

    private static Stream<String> provideValidCountryNames() {
        return Stream.of("a", "test", "test test", "test 12ac 02]", "a".repeat(256));
    }

    @ParameterizedTest
    @MethodSource("provideTooLongCountryNames")
    void countrySaveRequestShouldFailWhenInvalidNameIsSent(InvalidCountryName input) throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, input.countryName);

        var jsonResponse = mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo(input.errorMessage());
    }

    private record InvalidCountryName(String countryName, String errorMessage) {
    }

    private static Stream<InvalidCountryName> provideTooLongCountryNames() {
        return Stream.of(
                new InvalidCountryName(null, "{countryName = Country name may not be null or empty}"),
                new InvalidCountryName("", "{countryName = Country name may not be null or empty}"),
                new InvalidCountryName("   ", "{countryName = Country name may not be null or empty}"),
                new InvalidCountryName("\t", "{countryName = Country name may not be null or empty}"),
                new InvalidCountryName("\n", "{countryName = Country name may not be null or empty}"),
                new InvalidCountryName("a".repeat(257), "{countryName = Country name may not be longer then 256}"),
                new InvalidCountryName("ab".repeat(256), "{countryName = Country name may not be longer then 256}")
        );
    }

    @Test
    void countrySaveRequestShouldFailWithConflictResponseWhenCountryNameUnderGivenContinentAlreadyExists() throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void countryShouldBeSavedWhenGivenCountryNameAlreadyExistsUnderDifferentContinent() throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_1, "Test country 0");

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/countries/" + countryRepo.findByName("Test country 0").get(1).getId()));

        assertThat(countryRepo.findByName("Test country 0").get(1).getName()).isEqualTo("Test country 0");
        assertThat(countryRepo.findByName("Test country 0").get(1).getContinent().getName()).isEqualTo(CONTINENT_NAME_1);
    }

    @Test
    void userShouldGetNotFoundExceptionWhenNonExistingContinentNameIsSend() throws Exception {
        var request = new SaveCountryRequest("Invalid continent", "Test country");

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

    }


    @Test
    void countriesShouldBeReturnedInTwoPagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryResponse[] response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].countryName()).isEqualTo("Test country 4");
        assertThat(response[1].countryName()).isEqualTo("Test country 3");


        jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("countryId", response[1].countryId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        Arrays.stream(response).forEach(System.out::println);
        assertThat(response).hasSize(2);
        assertThat(response[0].countryName()).isEqualTo("Test country 2");
        assertThat(response[1].countryName()).isEqualTo("Test country 1");

        jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("countryId", response[1].countryId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
    }

    @Test
    void countriesShouldBeReturnedInTwoPagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryResponse[] response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
        assertThat(response[1].countryName()).isEqualTo("Test country 1");

        jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("countryId", response[1].countryId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .param("sd", "ASC")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].countryName()).isEqualTo("Test country 2");
        assertThat(response[1].countryName()).isEqualTo("Test country 3");

        jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("countryId", response[1].countryId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .param("sd", "ASC")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].countryName()).isEqualTo("Test country 4");
    }

    @Test
    void countryShouldBeDeletedWhenRequestIsSent() throws Exception {
        mockMvc.perform(delete("/countries/" + 4)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(countryRepo.findAll()).hasSize(4);
        assertThat(countryRepo.findById(4)).isEmpty();
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingCountryIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/countries/" + "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void errorShouldBeReturnedWhenCountryWithRegionsIsRequestedToBeDeleted() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/countries/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.CASCADE_DELETE_ERROR);
        assertThat(actual.errorMessage()).isEqualTo("Can't perform cascade delete");
    }

    @ParameterizedTest
    @MethodSource("provideValidCountryNames")
    void shouldUpdateCountryNameWhenNewNameIsValid(String newCountryName) throws Exception {
        var update = new UpdateCountryDetailsRequest(newCountryName);

        mockMvc.perform(put("/countries/" + 2 + "/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(countryRepo.findById(2).map(Country::getName)).hasValue(newCountryName);
    }

    @ParameterizedTest
    @MethodSource("provideTooLongCountryNames")
    void errorShouldBeReturnedWhenNewNameIsInvalid(InvalidCountryName input) throws Exception {
        var update = new UpdateCountryDetailsRequest(input.countryName);

        var jsonResponse = mockMvc.perform(put("/countries/" + 0 + "/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo(input.errorMessage());
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingCountryIsRequestedToBeUpdated() throws Exception {
        var update = new UpdateCountryDetailsRequest("New country name");

        mockMvc.perform(put("/countries/123/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    @Test
    void errorShouldBeReturnedWhenNewNameAlreadyExistsUnderTheSameContinent() throws Exception {
        var update = new UpdateCountryDetailsRequest("Test country 2");

        var jsonResponse = mockMvc.perform(put("/countries/1/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
        assertThat(actual.errorMessage()).isEqualTo("The given name is not valid as it already exists");
    }

    @Test
    void shouldUpdateCountryContinentNameWhileLeavingOriginalContinentNamesWhenNewContinentNameIsValid() throws Exception {
        var request = new UpdateCountryContinentRequest(CONTINENT_NAME_1);

        mockMvc.perform(put("/countries/" + 1 + "/continent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(countryRepo.findById(1).map(Country::getContinent).map(Continent::getName)).hasValue(CONTINENT_NAME_1);
        assertThat(countryRepo.findById(1).map(Country::getName)).hasValue("Test country 0");
    }

    @Test
    void errorShouldBeReturnedWhenCurrentCountryNameAlreadyExistsUnderNewContinentName() throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 4");
        var mvcResult = mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);
        var update = new UpdateCountryContinentRequest("Test continent 2");

        var jsonResponse = mockMvc.perform(put("/countries/" + id + "/continent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
        assertThat(actual.errorMessage()).isEqualTo("The given name is not valid as it already exists");
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingContinentIsSentToBeUpdated() throws Exception {
        var update = new UpdateCountryContinentRequest("Bad continent name");
        var jsonResponse = mockMvc.perform(put("/countries/" + 0 + "/continent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
        assertThat(actual.errorMessage()).isEqualTo("The specified element could not be found");
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingCountryIdIsSent() throws Exception {
        var update = new UpdateCountryContinentRequest(CONTINENT_NAME_1);

        var jsonResponse = mockMvc.perform(put("/countries/123/continent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
        assertThat(actual.errorMessage()).isEqualTo("The specified element could not be found");
    }

    @Test
    void countryShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/countries/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryResponse response = mapper.readValue(jsonResponse, GetCountryResponse.class);
        assertThat(response.countryName()).isEqualTo("Test country 0");
    }

    @Test
    void userShouldGetErrorResponseWhenNonExistingIdIsSent() throws Exception {
        mockMvc.perform(get("/countries/" + 100)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }
}
