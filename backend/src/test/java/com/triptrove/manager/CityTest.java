package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetCityResponse;
import com.triptrove.manager.application.dto.SaveCityRequest;
import com.triptrove.manager.application.dto.UpdateCityDetailsRequest;
import com.triptrove.manager.application.dto.UpdateCityRegionRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
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

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/cities-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class CityTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String REGION_NAME_0 = "Test region 0";
    public static final String REGION_NAME_1 = "Test region 1";
    public static final String REGION_NAME_2 = "Test region 2";
    public static final String CITY_NAME_0 = "Test city 0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RegionRepo regionRepo;

    @Autowired
    private CityRepo citRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    @ParameterizedTest
    @MethodSource("provideValidCityNames")
    void shouldSaveCityWhenCityNameIsValid(String cityName) throws Exception {
        var request = new SaveCityRequest(cityName, 1);

        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/cities/" + citRepo.findByName(cityName).getFirst().getId()));

        assertThat(citRepo.findByName(cityName)).hasSize(1);
        assertThat(citRepo.findByName(cityName).getFirst().getName()).isEqualTo(cityName);
    }

    private static Stream<String> provideValidCityNames() {
        return Stream.of("a", "test", "test test", "test 12ac 02]", "a".repeat(256));
    }

    @Test
    void userShouldGetErrorWhenGivenRegionNotExist() throws Exception {
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
    void userShouldGetErrorWhenGivenCityNameUnderRegionAlreadyExists() throws Exception {
        var request = new SaveCityRequest("Test city 0", 1);

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
    void userShouldGetErrorWhenRequestNotContainingRegionId() throws Exception {
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
    void cityShouldBeSavedWhenGivenNameAlreadyExistsUnderDifferentRegion() throws Exception {
        String cityName = "Test city 0";
        var request = new SaveCityRequest(cityName, 2);

        mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/cities/" + citRepo.findByName(cityName).get(1).getId()));

        assertThat(citRepo.findByName(cityName)).hasSize(2);
        assertThat(citRepo.findByName(cityName).get(1).getName()).isEqualTo(cityName);
        assertThat(citRepo.findByName(cityName).get(1).getRegion().getName()).isEqualTo(REGION_NAME_1);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidCityNames")
    void userShouldGetErrorWhenInvalidNameIsSent(InvalidCityName input) throws Exception {
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

    private record InvalidCityName(String cityName, String errorMessage) {
    }

    private static Stream<InvalidCityName> provideInvalidCityNames() {
        return Stream.of(
                new InvalidCityName(null, "{cityName = City name may not be null or empty}"),
                new InvalidCityName("", "{cityName = City name may not be null or empty}"),
                new InvalidCityName("   ", "{cityName = City name may not be null or empty}"),
                new InvalidCityName("\t", "{cityName = City name may not be null or empty}"),
                new InvalidCityName("\n", "{cityName = City name may not be null or empty}"),
                new InvalidCityName("a".repeat(257), "{cityName = City name may not be longer then 256}"),
                new InvalidCityName("ab".repeat(256), "{cityName = City name may not be longer then 256}")
        );
    }

    @Test
    void cityShouldBeReturnedInThreePagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCityResponse[] response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[1].cityName()).isEqualTo("Test city 3");
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_0);

        jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("cityId", response[1].cityId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_2);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_0);

        jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("cityId", response[1].cityId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].cityName()).isEqualTo("Test city 0");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    void cityShouldBeReturnedInThreePagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
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
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_0);

        jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("cityId", response[1].cityId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_2);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].cityName()).isEqualTo("Test city 3");
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_0);

        jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("cityId", response[1].cityId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    void cityListShouldBeReturnedEmptyWhenNoCityExists() throws Exception {
        citRepo.deleteAll();

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
    void cityShouldBeDeletedWhenRequestIsSent() throws Exception {
        Integer[] cityIds = {1, 2, 3, 4, 5};
        for (Integer id : cityIds) {
            mockMvc.perform(delete("/cities/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());
        }

        assertThat(citRepo.findAll()).isEmpty();
    }

    @Test
    void userShouldGetErrorWhenNonExistingCityIsRequestedToBeDeleted() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/cities/" + "100")
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
    void cityShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/cities/" + 1)
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
    void userShouldGetErrorWhenNonExistingCityIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/cities/" + 100)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @ParameterizedTest
    @MethodSource("provideValidCityNames")
    void shouldUpdateCityNameWhenNewNameIsValid(String newCityName) throws Exception {
        var update = new UpdateCityDetailsRequest(newCityName);
        mockMvc.perform(put("/cities/" + 1 + "/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(citRepo.findById(1).map(City::getName)).hasValue(newCityName);
        assertThat(citRepo.findById(1).map(City::getRegion).map(Region::getName)).hasValue(REGION_NAME_0);
        assertThat(citRepo.findById(1).map(City::getRegion).map(Region::getCountry).map(Country::getName)).hasValue(COUNTRY_NAME_0);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidCityNames")
    void userShouldGetErrorResponseWhenWhenNewNameIsValid(InvalidCityName input) throws Exception {
        var update = new UpdateCityDetailsRequest(input.cityName());
        var jsonResponse = mockMvc.perform(put("/cities/" + 1 + "/details")
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
    void userShouldGetErrorResponseWhenNonExistingCityIsRequestedToBeUpdated() throws Exception {
        var update = new UpdateCityDetailsRequest("New city name");

        var jsonResponse = mockMvc.perform(put("/cities/123/details")
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
    void userShouldGetErrorWhenNewCityNameAlreadyExistsUnderRegion() throws Exception {
        var update = new UpdateCityDetailsRequest("Test city 1");

        var jsonResponse = mockMvc.perform(put("/cities/1/details")
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
    void shouldUpdateCityRegionWhileLeavingOriginalCityNamesWhenRegionIdIsValid() throws Exception {
        var update = new UpdateCityRegionRequest(2);

        mockMvc.perform(put("/cities/1/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(citRepo.findById(1).map(City::getName)).hasValue(CITY_NAME_0);
        assertThat(citRepo.findById(1).map(City::getRegion).map(Region::getName)).hasValue(REGION_NAME_1);
    }

    @Test
    void userShouldGetErrorWhenCurrentRegionAlreadyContainsNewCityName() throws Exception {
        var request = new SaveCityRequest("Test city 0", 2);
        var mvcResult = mockMvc.perform(post("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);
        var update = new UpdateCityRegionRequest(1);

        var jsonResponse = mockMvc.perform(put("/cities/" + id + "/region")
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
    void userShouldGetErrorWhenNonExistingRegionIsSentToBeUpdated() throws Exception {
        var update = new UpdateCityRegionRequest(100);

        var jsonResponse = mockMvc.perform(put("/cities/1/region")
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
    void userShouldGetErrorWhenTryToUpdateRegionAndNonExistingCityIdIsSent() throws Exception {
        var update = new UpdateCityRegionRequest(1);

        var jsonResponse = mockMvc.perform(put("/cities/" + 100 + "/region")
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
    void userShouldGetErrorWhenNullRegionIdIsSent() throws Exception {
        var update = new UpdateCityRegionRequest(null);

        var jsonResponse = mockMvc.perform(put("/cities/1/region")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{regionId = must not be null}");
    }
}
