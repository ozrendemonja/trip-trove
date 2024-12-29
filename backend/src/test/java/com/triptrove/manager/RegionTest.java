package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetRegionResponse;
import com.triptrove.manager.application.dto.SaveRegionRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import org.junit.jupiter.api.BeforeAll;
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

import java.time.LocalDateTime;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
public class RegionTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME_0 = "Test continent 0";
    public static final String CONTINENT_NAME_1 = "Test continent 1";
    public static final String CONTINENT_NAME_2 = "Continent new 2";
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String COUNTRY_NAME_2 = "New ctest 2";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @Autowired
    private RegionRepo regionRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    @BeforeEach
    void setupRegion() {
        var continent0 = new Continent();
        continent0.setId((short) 0);
        continent0.setName(CONTINENT_NAME_0);
        continent0.setCreatedOn(LocalDateTime.now().minusDays(3));
        continentRepo.save(continent0);
        var continent1 = new Continent();
        continent1.setId((short) 1);
        continent1.setName(CONTINENT_NAME_1);
        continent1.setCreatedOn(LocalDateTime.now().minusDays(2));
        continentRepo.save(continent1);
        var continent2 = new Continent();
        continent2.setId((short) 2);
        continent2.setName(CONTINENT_NAME_2);
        continent2.setCreatedOn(LocalDateTime.now().minusDays(1));
        continentRepo.save(continent2);

        var country0 = new Country();
        country0.setName(COUNTRY_NAME_0);
        country0.setContinent(continent0);
        country0.setId(0);
        country0.setCreatedOn(LocalDateTime.now().minusDays(5));
        countryRepo.save(country0);
        var country1 = new Country();
        country1.setName(COUNTRY_NAME_1);
        country1.setContinent(continent0);
        country1.setId(1);
        country1.setCreatedOn(LocalDateTime.now().minusDays(4));
        countryRepo.save(country1);
        var country2 = new Country();
        country2.setName(COUNTRY_NAME_2);
        country2.setContinent(continent0);
        country2.setId(2);
        country2.setCreatedOn(LocalDateTime.now().minusDays(3));
        countryRepo.save(country2);
        var country3 = new Country();
        country3.setName(COUNTRY_NAME_0);
        country3.setContinent(continent1);
        country3.setId(3);
        country3.setCreatedOn(LocalDateTime.now().minusDays(2));
        countryRepo.save(country3);
        var country4 = new Country();
        country4.setName(COUNTRY_NAME_1);
        country4.setContinent(continent1);
        country4.setId(4);
        country4.setCreatedOn(LocalDateTime.now().minusDays(1));
        countryRepo.save(country4);
    }

    @ParameterizedTest
    @MethodSource("provideValidRegionNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldSaveRegionWhenRegionNameIsValid(String regionName) throws Exception {
        var request = new SaveRegionRequest(regionName, 0);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
// TODO Return when implement DB
//                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/regions/" + input.id()));
    }

    private static Stream<String> provideValidRegionNames() {
        return Stream.of("a", "test", "test test", "test 12ac 02]", "a".repeat(256));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionSaveRequestShouldBeRejectedWhenGivenCountryNotExist() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 100);
        var jsonResponse = mockMvc.perform(post("/regions")
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
    @MethodSource("provideInvalidRegionNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionSaveRequestShouldBeRejectedWhenInvalidNameIsSent(InvalidRegionName input) throws Exception {
        var request = new SaveRegionRequest(input.continentName(), 0);
        var jsonResponse = mockMvc.perform(post("/regions")
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

    private record InvalidRegionName(String continentName, String errorMessage) {
    }

    private static Stream<InvalidRegionName> provideInvalidRegionNames() {
        return Stream.of(
                new InvalidRegionName(null, "{regionName = Region name may not be null or empty}"),
                new InvalidRegionName("", "{regionName = Region name may not be null or empty}"),
                new InvalidRegionName("   ", "{regionName = Region name may not be null or empty}"),
                new InvalidRegionName("\t", "{regionName = Region name may not be null or empty}"),
                new InvalidRegionName("\n", "{regionName = Region name may not be null or empty}"),
                new InvalidRegionName("a".repeat(257), "{regionName = Region name may not be longer then 256}"),
                new InvalidRegionName("ab".repeat(256), "{regionName = Region name may not be longer then 256}")
        );
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionSaveRequestShouldBeRejectedWhenGivenRegionNameAlreadyExists() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 1);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(post("/regions")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionShouldBeSavedWhenGivenRegionNameAlreadyExistsUnderDifferentCountry() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 0);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveRegionRequest("Test region 0", 1);
        mockMvc.perform(post("/regions")
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
    void regionShouldBeReturnedInTwoPagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 1);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveRegionRequest("Test region 1", 0);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveRegionRequest("Test region 2", 0);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(get("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse[] response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].regionName()).isEqualTo("Test region 2");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[1].regionName()).isEqualTo("Test region 1");
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_0);

        jsonResponse = mockMvc.perform(get("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("regionId", response[1].regionId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionShouldBeReturnedInTwoPagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 1);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveRegionRequest("Test region 1", 0);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveRegionRequest("Test region 2", 0);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(get("/regions")
                        .param("sd", "ASC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse[] response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].regionName()).isEqualTo("Test region 1");
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_0);

        jsonResponse = mockMvc.perform(get("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("regionId", response[1].regionId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .param("sd", "ASC")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].regionName()).isEqualTo("Test region 2");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionShouldBeReturnedEmptyListWhenNoRegionExists() throws Exception {
        var jsonResponse = mockMvc.perform(get("/regions")
                        .param("sd", "ASC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse[] response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countryShouldBeDeletedWhenRequestIsSent() throws Exception {
        Integer[] regionIds = new Integer[3];
        var request = new SaveRegionRequest("Test region 0", 1);
        var mvcResult = mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        regionIds[0] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveRegionRequest("Test region 1", 0);
        mvcResult = mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        regionIds[1] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveRegionRequest("Test region 2", 0);
        mvcResult = mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        regionIds[2] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        for (Integer id : regionIds) {
            mockMvc.perform(delete("/regions/" + id.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());
        }

        assertThat(regionRepo.findAll()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingRegionIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/regions/" + "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void countryShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 1);
        var mvcResult = mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var jsonResponse = mockMvc.perform(get("/regions/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse response = mapper.readValue(jsonResponse, GetRegionResponse.class);
        assertThat(response.regionName()).isEqualTo("Test region 0");
        assertThat(response.countryName()).isEqualTo(COUNTRY_NAME_1);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetErrorResponseWhenNonExistingIdIsSent() throws Exception {
        mockMvc.perform(get("/countries/" + 100)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }


}
