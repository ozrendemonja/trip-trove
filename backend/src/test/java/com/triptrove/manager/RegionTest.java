package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetRegionResponse;
import com.triptrove.manager.application.dto.SaveRegionRequest;
import com.triptrove.manager.application.dto.UpdateRegionCountryRequest;
import com.triptrove.manager.application.dto.UpdateRegionDetailsRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.repo.CountryRepo;
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
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class RegionTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private RegionRepo regionRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    @ParameterizedTest
    @MethodSource("provideValidRegionNames")
    void shouldSaveRegionWhenRegionNameIsValid(String regionName) throws Exception {
        var request = new SaveRegionRequest(regionName, 1);
        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/regions/" + regionRepo.findByName(regionName).getFirst().getId()));

        assertThat(regionRepo.findByName(regionName)).hasSize(1);
        assertThat(regionRepo.findByName(regionName).getFirst().getName()).isEqualTo(regionName);
    }

    private static Stream<String> provideValidRegionNames() {
        return Stream.of("a", "test", "test test", "test 12ac 02]", "a".repeat(256));
    }

    @Test
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
    void regionSaveRequestShouldBeRejectedWhenInvalidNameIsSent(InvalidRegionName input) throws Exception {
        var request = new SaveRegionRequest(input.regionName(), 0);

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

    private record InvalidRegionName(String regionName, String errorMessage) {
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
    void regionSaveRequestShouldBeRejectedWhenGivenRegionNameUnderGivenCountryAlreadyExists() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 1);

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
    void regionShouldBeSavedWhenGivenRegionNameAlreadyExistsUnderDifferentCountry() throws Exception {
        String regionName = "Test region 0";
        var request = new SaveRegionRequest(regionName, 2);

        mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/regions/" + regionRepo.findByName(regionName).get(1).getId()));

        assertThat(regionRepo.findByName(regionName).get(1).getName()).isEqualTo(regionName);
    }

    @Test
    void regionShouldBeReturnedInThreePagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        final String COUNTRY_NAME_5 = "Test country 4";
        final String COUNTRY_NAME_3 = "Test country 2";

        var jsonResponse = mockMvc.perform(get("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse[] response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].regionName()).isEqualTo("Test region 4");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_5);
        assertThat(response[1].regionName()).isEqualTo("Test region 3");
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_3);

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
        assertThat(response).hasSize(2);
        assertThat(response[0].regionName()).isEqualTo("Test region 2");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
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
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    void regionShouldBeReturnedInThreePagesInAscendingOrderWhenAscOrderIsSent() throws Exception {
        final String COUNTRY_NAME_5 = "Test country 4";
        final String COUNTRY_NAME_3 = "Test country 2";

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
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
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
        assertThat(response).hasSize(2);
        assertThat(response[0].regionName()).isEqualTo("Test region 2");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].regionName()).isEqualTo("Test region 3");
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_3);

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
        assertThat(response[0].regionName()).isEqualTo("Test region 4");
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_5);
    }

    @Test
    void regionShouldBeDeletedWhenRequestIsSent() throws Exception {
        mockMvc.perform(delete("/regions/" + 5)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(regionRepo.findAll()).hasSize(4);
        assertThat(regionRepo.findById(5)).isEmpty();
    }

    @Test
    void errorShouldBeReturnedWhenRegionWithCitiesIsRequestedToBeDeleted() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/regions/" + 1)
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
    void errorShouldBeReturnedWhenRegionWithAttractionsIsRequestedToBeDeleted() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/regions/" + 4)
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
    void regionShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/regions/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse response = mapper.readValue(jsonResponse, GetRegionResponse.class);
        assertThat(response.regionName()).isEqualTo("Test region 0");
        assertThat(response.countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/regions/" + 100)
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

    @ParameterizedTest
    @MethodSource("provideValidRegionNames")
    void shouldUpdateRegionNameWhenNewNameIsValid(String newRegionName) throws Exception {
        var update = new UpdateRegionDetailsRequest(newRegionName);

        mockMvc.perform(put("/regions/1/details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(regionRepo.findById(1).map(Region::getName)).hasValue(newRegionName);
        assertThat(regionRepo.findById(1).map(Region::getCountry).map(Country::getName)).hasValue(COUNTRY_NAME_0);
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingRegionIsRequestedToBeUpdated() throws Exception {
        var update = new UpdateRegionDetailsRequest("New region name");

        var jsonResponse = mockMvc.perform(put("/regions/123/details")
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

    @ParameterizedTest
    @MethodSource("provideInvalidRegionNames")
    void errorShouldBeReturnedWhenNewNameIsInvalid(InvalidRegionName input) throws Exception {
        var update = new UpdateRegionDetailsRequest(input.regionName());

        var jsonResponse = mockMvc.perform(put("/regions/1/details")
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
    void errorShouldBeReturnedWhenNewRegionNameUnderGivenCountryAlreadyExists() throws Exception {
        var update = new UpdateRegionDetailsRequest("Test region 1");

        var jsonResponse = mockMvc.perform(put("/regions/1/details")
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
    void shouldUpdateRegionCountryNameWhileLeavingOriginalRegionNameWhenNewCountryIsGiven() throws Exception {
        var update = new UpdateRegionCountryRequest(2);

        mockMvc.perform(put("/regions/" + 1 + "/country")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(update)))
                .andExpect(status().isNoContent());

        assertThat(regionRepo.findById(1).map(Region::getCountry).map(Country::getName)).hasValue(COUNTRY_NAME_1);
        assertThat(countryRepo.findById(1).map(Country::getName)).hasValue(COUNTRY_NAME_0);
    }

    @Test
    void errorShouldBeReturnedWhenCurrentCountryAlreadyContainsRegionName() throws Exception {
        var request = new SaveRegionRequest("Test region 0", 2);
        var mvcResult = mockMvc.perform(post("/regions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        int id = Integer.parseInt(mvcResult.getResponse().getHeader("Location").split("/")[4]);
        var update = new UpdateRegionCountryRequest(1);

        var jsonResponse = mockMvc.perform(put("/regions/" + id + "/country")
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
    void errorShouldBeReturnedWhenNonExistingCountryIsSentToBeUpdated() throws Exception {
        var update = new UpdateRegionCountryRequest(100);

        var jsonResponse = mockMvc.perform(put("/regions/" + 1 + "/country")
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
    void errorShouldBeReturnedWhenNonExistingRegionIdIsSent() throws Exception {
        var update = new UpdateRegionCountryRequest(1);
        var jsonResponse = mockMvc.perform(put("/regions/" + 100 + "/country")
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
}
