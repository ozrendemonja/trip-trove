package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.GetCountryRequest;
import com.triptrove.manager.application.dto.SaveCountryRequest;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import org.hamcrest.core.Is;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
public class CountryTests {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME = "Test continent";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @BeforeEach
    void setupContinent() {
        var continent = new Continent();
        continent.setName(CONTINENT_NAME);
        continentRepo.save(continent);
    }

    @ParameterizedTest
    @MethodSource("provideValidCountryNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countryShouldBeSavedWhenValidNameIsSent(String countryName) throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME, countryName);

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/countries/" + UriUtils.encode(countryName, StandardCharsets.UTF_8)));

        assertThat(countryRepo.findAll().size()).isEqualTo(1);
        assertThat(countryRepo.findAll().getFirst().getName()).isEqualTo(countryName);
    }

    private static Stream<String> provideValidCountryNames() {
        return Stream.of("a", "test", "test test", "test 12ac 02]", "a".repeat(64));
    }


    @ParameterizedTest
    @MethodSource("provideTooLongCountryNames")
    void countrySaveRequestShouldBeRejectedWhenInvalidNameIsSent(InvalidCountryName input) throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME, input.continentName);

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.countryName", Is.is(input.errorMessage)));
    }

    private record InvalidCountryName(String continentName, String errorMessage) {
    }

    private static Stream<InvalidCountryName> provideTooLongCountryNames() {
        return Stream.of(
                new InvalidCountryName(null, "Country name may not be null or empty"),
                new InvalidCountryName("", "Country name may not be null or empty"),
                new InvalidCountryName("   ", "Country name may not be null or empty"),
                new InvalidCountryName("\t", "Country name may not be null or empty"),
                new InvalidCountryName("\n", "Country name may not be null or empty"),
                new InvalidCountryName("a".repeat(257), "Country name may not be longer then 256"),
                new InvalidCountryName("ab".repeat(256), "Country name may not be longer then 256")
        );
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetConflictResponseWhenDuplicateCountryNameSend() throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME, "Test country 0");
        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetNotFoundExceptionWhenNonExistingContinentNameIsSend() throws Exception {
        var request = new SaveCountryRequest("Invalid continent", "Test country");

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void emptyListOfCountriesShouldBeReturnWhenNoCountriesAreAdded() throws Exception {
        var jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryRequest[] response = mapper.readValue(jsonResponse, GetCountryRequest[].class);
        assertThat(response).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countriesShouldBeReturnedInAscendingOrderWhenNoOrderIsSent() throws Exception {
        var expected = new GetCountryRequest[3];
        var request = new SaveCountryRequest(CONTINENT_NAME, "Test country 0");
        expected[0] = new GetCountryRequest(CONTINENT_NAME, "Test country 0");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveCountryRequest(CONTINENT_NAME, "Test country 1");
        expected[1] = new GetCountryRequest(CONTINENT_NAME, "Test country 1");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveCountryRequest(CONTINENT_NAME, "Test country 2");
        expected[2] = new GetCountryRequest(CONTINENT_NAME, "Test country 2");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        var jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryRequest[] response = mapper.readValue(jsonResponse, GetCountryRequest[].class);
        assertThat(response).usingRecursiveFieldByFieldElementComparator().isEqualTo(expected);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countriesShouldBeReturnedInDescendingOrderWhenDescOrderIsSent() throws Exception {
        var expected = new GetCountryRequest[3];
        var request = new SaveCountryRequest(CONTINENT_NAME, "Test country 0");
        expected[2] = new GetCountryRequest(CONTINENT_NAME, "Test country 0");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveCountryRequest(CONTINENT_NAME, "Test country 1");
        expected[1] = new GetCountryRequest(CONTINENT_NAME, "Test country 1");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveCountryRequest(CONTINENT_NAME, "Test country 2");
        expected[0] = new GetCountryRequest(CONTINENT_NAME, "Test country 2");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        var jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "DESC")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryRequest[] response = mapper.readValue(jsonResponse, GetCountryRequest[].class);
        assertThat(response).usingRecursiveFieldByFieldElementComparator().isEqualTo(expected);
    }

}
