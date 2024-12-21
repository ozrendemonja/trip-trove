package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.application.dto.UpdateContinentRequest;
import com.triptrove.manager.domain.repo.ContinentRepo;
import org.hamcrest.core.Is;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
class ContinentTests {
    private final static ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContinentRepo continentRepo;

    @ParameterizedTest
    @MethodSource("provideValidContinentNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentShouldBeSavedWhenValidNameIsSent(String continentName) throws Exception {
        var request = new SaveContinentRequest(continentName);

        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/continents/" + UriUtils.encode(continentName, StandardCharsets.UTF_8)));

        assertThat(continentRepo.findAll().size()).isEqualTo(1);
        assertThat(continentRepo.findAll().getFirst().getName()).isEqualTo(continentName);
    }

    private static Stream<String> provideValidContinentNames() {
        return Stream.of("test", "test123", "test test", "test 12ac 02]", "a".repeat(64));
    }

    @ParameterizedTest
    @MethodSource("provideTooLongContinentNames")
    void continentSaveRequestShouldBeRejectedWhenInvalidNameIsSent(InvalidContinentName input) throws Exception {
        var request = new SaveContinentRequest(input.continentName);

        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.continentName", Is.is(input.errorMessage)));
    }

    private record InvalidContinentName(String continentName, String errorMessage) {
    }

    private static Stream<InvalidContinentName> provideTooLongContinentNames() {
        return Stream.of(
                new InvalidContinentName(null, "Continent name may not be null or empty"),
                new InvalidContinentName("", "Continent name may not be null or empty"),
                new InvalidContinentName("   ", "Continent name may not be null or empty"),
                new InvalidContinentName("\t", "Continent name may not be null or empty"),
                new InvalidContinentName("\n", "Continent name may not be null or empty"),
                new InvalidContinentName("a".repeat(65), "Continent name may not be longer then 64"),
                new InvalidContinentName("ab".repeat(64), "Continent name may not be longer then 64")
        );
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentsShouldBeReturnedInAscendingOrderWhenNoOrderIsSent() throws Exception {
        var expected = new GetContinentResponse[3];
        var request = new SaveContinentRequest("Test continent 0");
        expected[0] = new GetContinentResponse("Test continent 0");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent 1");
        expected[1] = new GetContinentResponse("Test continent 1");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent 2");
        expected[2] = new GetContinentResponse("Test continent 2");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentsShouldBeReturnedInDescendingOrderWhenDescOrderIsSent() throws Exception {
        var expected = new GetContinentResponse[3];
        var request = new SaveContinentRequest("Test continent 0");
        expected[2] = new GetContinentResponse("Test continent 0");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent 1");
        expected[1] = new GetContinentResponse("Test continent 1");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent 2");
        expected[0] = new GetContinentResponse("Test continent 2");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentsShouldBeListedInDescendingOrderWithTheMostRecentlyModifiedElementAppearingFirst() throws Exception {
        var expected = new GetContinentResponse[3];
        var request = new SaveContinentRequest("Test continent 0");
        expected[2] = new GetContinentResponse("Test continent 0");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent 1");
        expected[0] = new GetContinentResponse("Test continent 1");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent 2");
        expected[1] = new GetContinentResponse("Test continent 2");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        var updateRequest = new UpdateContinentRequest("Test continent 0");
        mockMvc.perform(put("/continents/" + "Test continent 0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());


        var jsonResponse = mockMvc.perform(get("/continents")
                        .param("sd", "ASC")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void emptyListOfContinentsShouldBeReturnedWhenThereIsNoContinentSaved() throws Exception {
        var jsonResponse = mockMvc.perform(get("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetContinentResponse[] response = mapper.readValue(jsonResponse, GetContinentResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentsShouldBeDeletedWhenRequestIsSent() throws Exception {
        var request = new SaveContinentRequest("Test continent0");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent1");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveContinentRequest("Test continent2");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));


        mockMvc.perform(delete("/continents/" + "Test continent0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/continents/" + "Test continent1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/continents/" + "Test continent2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());


        assertThat(continentRepo.findAll()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingContinentIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/continents/" + "Test continent0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingContinentIsRequested() throws Exception {
        mockMvc.perform(get("/continents/" + "Test continent0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentShouldBeReturnedWhenRequestIsSent() throws Exception {
        var expected = new GetContinentResponse("Test continent 0");
        var request = new SaveContinentRequest("Test continent 0");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveContinentRequest("Test continent 1");
        mockMvc.perform(post("/continents")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetConflictResponseWhenDuplicateContinentNameSend() throws Exception {
        var request = new SaveContinentRequest("Test continent 0");
        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void continentNameShouldBeUpdatedWhenNewNameIsSend() throws Exception {
        var initialRequest = new SaveContinentRequest("Test continent 0");
        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated());

        var request = new UpdateContinentRequest("Updated test continent 0");
        mockMvc.perform(put("/continents/" + "Test continent 0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(continentRepo.findAll().size()).isEqualTo(1);
        assertThat(continentRepo.findAll().getFirst().getName()).isEqualTo("Updated test continent 0");
        assertThat(continentRepo.findAll().getFirst().getUpdatedOn().orElseThrow()).isCloseTo(LocalDateTime.now(), within(1, ChronoUnit.HOURS));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetNotFoundErrorWhenOldNameDoestExist() throws Exception {
        var request = new UpdateContinentRequest("Updated test continent 0");
        mockMvc.perform(put("/continents/" + "Test continent 0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @MethodSource("provideTooLongContinentNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNewContinentNameIsInvalid(InvalidContinentName input) throws Exception {
        var initialRequest = new SaveContinentRequest("Test continent 0");
        mockMvc.perform(post("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated());

        var request = new UpdateContinentRequest(input.continentName);
        mockMvc.perform(put("/continents/Test continent 0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.continentName", Is.is(input.errorMessage)));
    }

}
