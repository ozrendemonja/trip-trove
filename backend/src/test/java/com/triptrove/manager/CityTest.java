package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetCityResponse;
import com.triptrove.manager.application.dto.SaveCityRequest;
import com.triptrove.manager.application.dto.UpdateCityDetailsRequest;
import com.triptrove.manager.application.dto.UpdateCityRegionRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.repo.CityRepo;
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
public class CityTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME_0 = "Test continent 0";
    public static final String CONTINENT_NAME_1 = "Test continent 1";
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String REGION_NAME_0 = "Test region 0";
    public static final String REGION_NAME_1 = "Test region 1";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @Autowired
    private RegionRepo regionRepo;

    @Autowired
    private CityRepo citRepo;

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

        var region0 = new Region();
        region0.setName(REGION_NAME_0);
        region0.setCountry(country0);
        region0.setId(0);
        region0.setCreatedOn(LocalDateTime.now().minusDays(3));
        regionRepo.save(region0);
        var region1 = new Region();
        region1.setName(REGION_NAME_1);
        region1.setCountry(country1);
        region1.setId(1);
        region1.setCreatedOn(LocalDateTime.now().minusDays(3));
        regionRepo.save(region1);
        var region2 = new Region();
        region2.setName(REGION_NAME_0);
        region2.setCountry(country1);
        region2.setId(2);
        region2.setCreatedOn(LocalDateTime.now().minusDays(3));
        regionRepo.save(region2);
        var region3 = new Region();
        region3.setName(REGION_NAME_1);
        region3.setCountry(country1);
        region3.setId(3);
        region3.setCreatedOn(LocalDateTime.now().minusDays(3));
        regionRepo.save(region3);
    }

    @ParameterizedTest
    @MethodSource("provideValidCityNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldSaveCityWhenCityNameIsValid(String regionName) throws Exception {
        var request = new SaveCityRequest(regionName, 0);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
// TODO Return when implement DB
//                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/regions/" + input.id()));
    }

    private static Stream<String> provideValidCityNames() {
        return Stream.of("a", "test", "test test", "test 12ac 02]", "a".repeat(256));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void citySaveRequestShouldBeRejectedWhenGivenRegionNotExist() throws Exception {
        var request = new SaveCityRequest("Test city 0", 100);
        var jsonResponse = mockMvc.perform(post("/cities")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void citySaveRequestShouldBeRejectedWhenGivenCityNameUnderRegionAlreadyExists() throws Exception {
        var request = new SaveCityRequest("Test city 0", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(post("/cities")
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
    void citySaveRequestShouldBeRejectedWhenRequestDoesntContainsRegionId() throws Exception {
        var request = new SaveCityRequest("Test city 0", null);
        var jsonResponse = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()).andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{regionId = must not be null}");
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void cityShouldBeSavedWhenGivenNameAlreadyExistsUnderDifferentRegion() throws Exception {
        var request = new SaveCityRequest("Test city 0", 0);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveCityRequest("Test city 0", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        // TODO Return when implement DB
//                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/countries/" + UriUtils.encode("Test country 0", StandardCharsets.UTF_8)));
    }

    @ParameterizedTest
    @MethodSource("provideInvalidCityNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionSaveRequestShouldBeRejectedWhenInvalidNameIsSent(InvalidRegionName input) throws Exception {
        var request = new SaveCityRequest(input.cityName(), 0);
        var jsonResponse = mockMvc.perform(post("/cities")
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

    private record InvalidRegionName(String cityName, String errorMessage) {
    }

    private static Stream<InvalidRegionName> provideInvalidCityNames() {
        return Stream.of(
                new InvalidRegionName(null, "{cityName = City name may not be null or empty}"),
                new InvalidRegionName("", "{cityName = City name may not be null or empty}"),
                new InvalidRegionName("   ", "{cityName = City name may not be null or empty}"),
                new InvalidRegionName("\t", "{cityName = City name may not be null or empty}"),
                new InvalidRegionName("\n", "{cityName = City name may not be null or empty}"),
                new InvalidRegionName("a".repeat(257), "{cityName = City name may not be longer then 256}"),
                new InvalidRegionName("ab".repeat(256), "{cityName = City name may not be longer then 256}")
        );
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionShouldBeReturnedInTwoPagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        var request = new SaveCityRequest("Test city 0", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveCityRequest("Test city 1", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveCityRequest("Test city 2", 0);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCityResponse[] response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].cityName()).isEqualTo("Test city 2");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_1);

        jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("regionId", response[1].cityId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].cityName()).isEqualTo("Test city 0");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionShouldBeReturnedInTwoPagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
        var request = new SaveCityRequest("Test city 0", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveCityRequest("Test city 1", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveCityRequest("Test city 2", 0);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(get("/cities")
                        .param("sd", "ASC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCityResponse[] response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].cityName()).isEqualTo("Test city 0");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_1);

        jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("regionId", response[1].cityId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].cityName()).isEqualTo("Test city 2");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void cityListShouldBeReturnedEmptyWhenNoCityExists() throws Exception {
        var jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCityResponse[] response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void cityShouldBeDeletedWhenRequestIsSent() throws Exception {
        Integer[] cityIds = new Integer[3];
        var request = new SaveCityRequest("Test city 0", 1);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        cityIds[0] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveCityRequest("Test city 1", 0);
        mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        cityIds[1] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveCityRequest("Test region 2", 0);
        mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        cityIds[2] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        for (Integer id : cityIds) {
            mockMvc.perform(delete("/cities/" + id.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());
        }

        assertThat(citRepo.findAll()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingCityIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/cities/" + "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void cityShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var request = new SaveCityRequest("Test city 0", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var jsonResponse = mockMvc.perform(get("/cities/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCityResponse response = mapper.readValue(jsonResponse, GetCityResponse.class);
        assertThat(response.cityName()).isEqualTo("Test city 0");
        assertThat(response.regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response.countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetErrorResponseWhenNonExistingIdIsSent() throws Exception {
        mockMvc.perform(get("/cities/" + 100)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @MethodSource("provideValidCityNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldUpdateRegionNameWhenNewNameIsValid(String newCityName) throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var update = new UpdateCityDetailsRequest(newCityName);
        mockMvc.perform(put("/cities/" + id + "/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(citRepo.findAll()).hasSize(1);
        assertThat(citRepo.findAll().getFirst().getName()).isEqualTo(newCityName);
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_0);
        assertThat(citRepo.findAll().getFirst().getRegion().getCountry().getName()).isEqualTo(COUNTRY_NAME_0);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidCityNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetErrorResponseWhenWhenNewNameIsValid(InvalidRegionName input) throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var update = new UpdateCityDetailsRequest(input.cityName());
        var jsonResponse = mockMvc.perform(put("/cities/" + id + "/details")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingCityIsRequestedToBeUpdated() throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var update = new UpdateCityDetailsRequest("New city name");
        mockMvc.perform(put("/cities/123/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());

        assertThat(citRepo.findAll()).hasSize(1);
        assertThat(citRepo.findAll().getFirst().getName()).isEqualTo("Old city name");
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_0);
        assertThat(citRepo.findAll().getFirst().getRegion().getCountry().getName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldUpdateCityRegionNameWhileLeavingOriginalRegionNamesWhenNewCityNameIsValid() throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var update = new UpdateCityRegionRequest(1);
        mockMvc.perform(put("/cities/" + id + "/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(citRepo.findAll()).hasSize(1);
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_1);
        assertThat(regionRepo.findAll().stream().map(Region::getName).toList()).containsExactlyInAnyOrder(REGION_NAME_0, REGION_NAME_1, REGION_NAME_0, REGION_NAME_1);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenWhenCurrentRegionAlreadyContainsNewCityName() throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveCityRequest("Old city name", 1);
        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var update = new UpdateCityRegionRequest(1);
        mockMvc.perform(put("/cities/" + id + "/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isConflict());

        assertThat(citRepo.findAll()).hasSize(2);
        assertThat(citRepo.findAll().getFirst().getName()).isEqualTo("Old city name");
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_0);
        assertThat(citRepo.findAll().get(1).getName()).isEqualTo("Old city name");
        assertThat(citRepo.findAll().get(1).getRegion().getName()).isEqualTo(REGION_NAME_1);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldUpdateCityRegionNameWhenNewNameIsValid() throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var update = new UpdateCityRegionRequest(1);
        mockMvc.perform(put("/cities/" + id + "/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(citRepo.findAll()).hasSize(1);
        assertThat(citRepo.findAll().getFirst().getName()).isEqualTo("Old city name");
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_1);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingRegionIsSentToBeUpdated() throws Exception {
        var request = new SaveCityRequest("Old city name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var update = new UpdateCityRegionRequest(100);
        mockMvc.perform(put("/cities/" + id + "/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());

        assertThat(citRepo.findAll()).hasSize(1);
        assertThat(citRepo.findAll().getFirst().getName()).isEqualTo("Old city name");
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_0);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingRegionIdIsSent() throws Exception {
        var update = new UpdateCityRegionRequest(1);
        mockMvc.perform(put("/cities/" + 100 + "/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNullRegionIdIsSent() throws Exception {
        var request = new SaveCityRequest("Old country name", 0);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var update = new UpdateCityRegionRequest(null);
        mockMvc.perform(put("/cities/" + id + "/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest());

        assertThat(citRepo.findAll()).hasSize(1);
        assertThat(citRepo.findAll().getFirst().getName()).isEqualTo("Old country name");
        assertThat(citRepo.findAll().getFirst().getRegion().getName()).isEqualTo(REGION_NAME_0);
    }
}
