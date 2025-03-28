package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.application.dto.UpdateContinentRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class ContinentTests extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContinentRepo continentRepo;

    @Autowired
    CountryRepo countryRepo;


    @ParameterizedTest
    @MethodSource("provideValidContinentNames")
    void continentShouldBeSavedWhenValidNameIsUsed(String continentName) throws Exception {
        var request = new SaveContinentRequest(continentName);

        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/continents/" + UriUtils.encode(continentName, StandardCharsets.UTF_8)));

        assertThat(continentRepo.findByName(continentName).map(Continent::getName)).hasValue(continentName);
    }

    private static Stream<String> provideValidContinentNames() {
        return Stream.of("test", "test123", "test test", "test 12ac 02]", "a".repeat(64));
    }

    @ParameterizedTest
    @MethodSource("provideInvalidContinentNames")
    void continentShouldNotBeSavedWhenInvalidNameIsUsed(InvalidContinentName input) throws Exception {
        var request = new SaveContinentRequest(input.continentName);

        var jsonResponse = mockMvc.perform(post("/continents")
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

    private record InvalidContinentName(String continentName, String errorMessage) {
    }

    private static Stream<InvalidContinentName> provideInvalidContinentNames() {
        return Stream.of(
                new InvalidContinentName(null, "{continentName = Continent name may not be null or empty}"),
                new InvalidContinentName("", "{continentName = Continent name may not be null or empty}"),
                new InvalidContinentName("   ", "{continentName = Continent name may not be null or empty}"),
                new InvalidContinentName("\t", "{continentName = Continent name may not be null or empty}"),
                new InvalidContinentName("\n", "{continentName = Continent name may not be null or empty}"),
                new InvalidContinentName("a".repeat(65), "{continentName = Continent name may not be longer then 64}"),
                new InvalidContinentName("ab".repeat(64), "{continentName = Continent name may not be longer then 64}")
        );
    }

    @Test
    void continentsShouldBeReturnedInAscendingOrderWithTheMostRecentlyModifiedElementAppearingLast() throws Exception {
        GetContinentResponse[] expected = {
                new GetContinentResponse("Test continent 2"),
                new GetContinentResponse("Test continent 1"),
                new GetContinentResponse("Test continent 3"),
                new GetContinentResponse("Test continent 0")
        };

        var jsonResponse = mockMvc.perform(get("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetContinentResponse[] response = mapper.readValue(jsonResponse, GetContinentResponse[].class);
        assertThat(response).usingRecursiveFieldByFieldElementComparator().isEqualTo(expected);
    }

    @Test
    void continentsShouldBeListedInDescendingOrderWithTheMostRecentlyModifiedElementAppearingFirstWhenDescOrderIsSpecified() throws Exception {
        GetContinentResponse[] expected = {
                new GetContinentResponse("Test continent 0"),
                new GetContinentResponse("Test continent 3"),
                new GetContinentResponse("Test continent 1"),
                new GetContinentResponse("Test continent 2")
        };

        var jsonResponse = mockMvc.perform(get("/continents")
                        .param("sd", "DESC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetContinentResponse[] response = mapper.readValue(jsonResponse, GetContinentResponse[].class);
        assertThat(response).usingRecursiveFieldByFieldElementComparator().isEqualTo(expected);
    }


    @Test
    void continentsShouldBeDeletedWhenPresentedNameIsProvided() throws Exception {
        mockMvc.perform(delete("/continents/" + "Test continent 3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(continentRepo.findAll()).hasSize(3);
        assertThat(continentRepo.findById((short) 4)).isEmpty();
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingContinentIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/continents/" + "Test continent0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void errorShouldBeReturnedWhenContinentWithCountriesIsRequestedToBeDeleted() throws Exception {
        Country country = new Country();
        country.setName("Test country 10");
        country.setContinent(continentRepo.findByName("Test continent 0").orElseThrow(Exception::new));
        countryRepo.save(country);

        var jsonResponse = mockMvc.perform(delete("/continents/" + "Test continent 0")
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

    @Test
    void continentWithARequiredNameShouldBeReturnedWhenExistingNameIsProvided() throws Exception {
        var expected = new GetContinentResponse("Test continent 0");

        var jsonResponse = mockMvc.perform(get("/continents/Test continent 0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, GetContinentResponse.class);
        assertThat(actual).isEqualTo(expected);
    }

    @Test
    void errorShouldBeReturnedWhenAskedForContinentUsingNonExistingName() throws Exception {
        var jsonResponse = mockMvc.perform(get("/continents/Test continent 123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
        assertThat(actual.errorMessage()).isEqualTo("The specified element could not be found");
    }

    @Test
    void userShouldBePreventedToSaveContinentWhenNewContinentNameAlreadyExists() throws Exception {
        var request = new SaveContinentRequest("Test continent 0");

        var jsonResponse = mockMvc.perform(post("/continents")
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

    @Test
    void continentNameShouldBeUpdatedWhenNewNameIsProvided() throws Exception {
        var request = new UpdateContinentRequest("Updated test continent 0");

        mockMvc.perform(put("/continents/" + "Test continent 0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(continentRepo.findById((short) 1).map(Continent::getName)).hasValue("Updated test continent 0");
    }

    @Test
    void updatedOnTimeShouldBeSetWhenContinentNameIsChanged() throws Exception {
        var request = new UpdateContinentRequest("Updated test continent 1");

        mockMvc.perform(put("/continents/" + "Test continent 1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(continentRepo.findById((short) 2).flatMap(Continent::getUpdatedOn).orElseThrow()).isCloseTo(LocalDateTime.now(), within(5, ChronoUnit.MINUTES));
    }

    @Test
    void errorShouldBeReturnedWhenUserTryToUpdateContinentWithPreviouslyNotExistedContinentName() throws Exception {
        var request = new UpdateContinentRequest("Updated test continent 1");

        var jsonResponse = mockMvc.perform(put("/continents/" + "Test continent 123")
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

    @ParameterizedTest
    @MethodSource("provideInvalidContinentNames")
    void errorShouldBeReturnedWhenNewContinentNameIsInvalid(InvalidContinentName input) throws Exception {
        var request = new UpdateContinentRequest(input.continentName);

        var jsonResponse = mockMvc.perform(put("/continents/Test continent 0")
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

    @Test
    void errorShouldBeReturnedWhenNewContinentNameAlreadyExists() throws Exception {
        var request = new UpdateContinentRequest("Test continent 1");

        var jsonResponse = mockMvc.perform(put("/continents/Test continent 0")
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
}