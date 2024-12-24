package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetCountryResponse;
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
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
public class CountryTests {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME_0 = "Test continent";
    public static final String CONTINENT_NAME_1 = "Test continent new";


    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @BeforeEach
    void setupContinent() {
        var continent0 = new Continent();
        continent0.setName(CONTINENT_NAME_0);
        continentRepo.save(continent0);

        var continent2 = new Continent();
        continent2.setName(CONTINENT_NAME_1);
        continentRepo.save(continent2);
    }

    @ParameterizedTest
    @MethodSource("provideValidCountryNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countryShouldBeSavedWhenValidNameIsSent(ValidCountryName input) throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, input.name());

        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        // TODO Return when implement DB
//                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/countries/" + input.id()));

        assertThat(countryRepo.findAll().size()).isEqualTo(1);
        assertThat(countryRepo.findAll().getFirst().getName()).isEqualTo(input.name());
    }

    private record ValidCountryName(String name, Integer id) {
    }

    private static Stream<ValidCountryName> provideValidCountryNames() {
        return Stream.of(
                new ValidCountryName("a", 0),
                new ValidCountryName("test", 1),
                new ValidCountryName("test test", 2),
                new ValidCountryName("test 12ac 02]", 3),
                new ValidCountryName("a".repeat(64), 4)
        );
    }


    @ParameterizedTest
    @MethodSource("provideTooLongCountryNames")
    void countrySaveRequestShouldBeRejectedWhenInvalidNameIsSent(InvalidCountryName input) throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, input.continentName);

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
    void userShouldGetConflictResponseWhenCountryNameUnderGivenContinentAlreadyExists() throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");
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
    void countryShouldBeSavedWhenGivenCountryNameAlreadyExistsUnderDifferentContinent() throws Exception {
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");
        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveCountryRequest(CONTINENT_NAME_1, "Test country 0");
        mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        // TODO Return when implement DB
//                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/countries/" + UriUtils.encode("Test country 0", StandardCharsets.UTF_8)));
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

        GetCountryResponse[] response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countriesShouldBeReturnedInTwoPagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        mapper.registerModule(new JavaTimeModule());
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 1");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 2");
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

        GetCountryResponse[] response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countriesShouldBeReturnedInTwoPagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
        mapper.registerModule(new JavaTimeModule());
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 1");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 2");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

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
        assertThat(response[0].countryId()).isEqualTo(0);
        assertThat(response[1].countryName()).isEqualTo("Test country 1");
        assertThat(response[1].countryId()).isEqualTo(1);

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
        assertThat(response[0].countryName()).isEqualTo("Test country 2");
        assertThat(response[0].countryId()).isEqualTo(2);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countriesShouldBeReturnedInThreePagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
        mapper.registerModule(new JavaTimeModule());
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveCountryRequest(CONTINENT_NAME_1, "Test country 1");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 2");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveCountryRequest(CONTINENT_NAME_1, "Test country 3");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));
        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 4");
        mockMvc.perform(post("/countries")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .content(mapper.writeValueAsString(request)));

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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countryShouldBeDeletedWhenRequestIsSent() throws Exception {
        Integer[] countryIds = new Integer[3];
        var request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 0");
        var mvcResult = mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        countryIds[0] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveCountryRequest(CONTINENT_NAME_0, "Test country 1");
        mvcResult = mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        countryIds[1] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveCountryRequest(CONTINENT_NAME_1, "Test country 0");
        mvcResult = mockMvc.perform(post("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        countryIds[2] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        for (Integer id : countryIds) {
            mockMvc.perform(delete("/countries/" + id.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());
        }

        assertThat(countryRepo.findAll()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingCountryIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/continents/" + "0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

}
