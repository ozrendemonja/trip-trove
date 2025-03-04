package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class AttractionTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String REGION_NAME_0 = "Test region 0";
    public static final String REGION_NAME_1 = "Test region 1";
    public static final String REGION_NAME_3 = "Test region 3";
    public static final String CITY_NAME_0 = "Test city 0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CityRepo cityRepo;

    @Autowired
    private AttractionRepo attractionRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    private record InvalidFieldSize(String attractionName, String attractionAddress, String tip, String infoFrom,
                                    String[] errorMessages) {
    }

    @Test
    void attractionShouldBeReturnedInThreePagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        final String COUNTRY_NAME_2 = "Test country 2";
        final String REGION_NAME_2 = "Test region 2";
        var jsonResponse = mockMvc.perform(get("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 3");
        assertThat(response[0].cityName()).isNull();
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[0].mainAttractionName()).isEqualTo("Test attraction 0");
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[1].cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_3);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_2);

        jsonResponse = mockMvc.perform(get("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("attractionId", response[1].attractionId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 1");
        assertThat(response[0].cityName()).isNull();
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_2);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 0");
        assertThat(response[1].cityName()).isNull();
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_2);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_1);

        jsonResponse = mockMvc.perform(get("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("attractionId", response[1].attractionId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 0");
        assertThat(response[0].cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
    }

    @Test
    void attractionShouldBeReturnedInThreePagesInAscendingOrderWhenASCOrderIsSent() throws Exception {
        final String COUNTRY_NAME_2 = "Test country 2";
        final String REGION_NAME_2 = "Test region 2";

        var jsonResponse = mockMvc.perform(get("/attractions")
                        .param("sd", "ASC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 0");
        assertThat(response[0].cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 0");
        assertThat(response[1].cityName()).isNull();
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_2);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_1);

        jsonResponse = mockMvc.perform(get("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("attractionId", response[1].attractionId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 1");
        assertThat(response[0].cityName()).isNull();
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_2);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[1].cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_3);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_2);

        jsonResponse = mockMvc.perform(get("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("sd", "ASC")
                        .param("attractionId", response[1].attractionId().toString())
                        .param("updatedOn", response[1].changedOn().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 3");
        assertThat(response[0].cityName()).isNull();
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[0].mainAttractionName()).isEqualTo("Test attraction 0");
    }

    @Test
    void attractionShouldBeDeletedWhenRequestIsSent() throws Exception {
        Integer[] attractionIds = {1, 2, 3, 4, 5};

        for (Integer id : attractionIds) {
            mockMvc.perform(delete("/attractions/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());
        }

        assertThat(attractionRepo.findAll()).isEmpty();
    }

    @Test
    void errorShouldBeReturnedWhenNonExistingAttractionIsRequestedToBeDeleted() throws Exception {
        var jsonResponse = mockMvc.perform(delete("/attractions/" + "100")
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
    void attractionShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/attractions/" + 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse response = mapper.readValue(jsonResponse, GetAttractionResponse.class);
        assertThat(response.attractionName()).isEqualTo("Test attraction 0");
        assertThat(response.cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response.regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response.countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response.isCountrywide()).isTrue();
        assertThat(response.mainAttractionName()).isNull();
        assertThat(response.attractionAddress()).isEqualTo("Test address 1");
        assertThat(response.attractionLocation().longitude()).isEqualTo(90.000001);
        assertThat(response.attractionLocation().latitude()).isEqualTo(-7.4247538);
        assertThat(response.attractionCategory()).isEqualTo(AttractionCategoryResponse.HISTORIC_SITE);
        assertThat(response.attractionType()).isEqualTo(AttractionTypeResponse.STABLE);
        assertThat(response.mustVisit()).isTrue();
        assertThat(response.isTraditional()).isTrue();
        assertThat(response.tip()).isEqualTo("Test tip");
        assertThat(response.infoFrom()).isEqualTo("Functional Test");
        assertThat(response.infoRecorded()).isEqualTo(LocalDate.parse("2024-08-02"));
        assertThat(response.optimalVisitPeriod().fromDate()).isEqualTo(LocalDate.parse("2024-10-02"));
        assertThat(response.optimalVisitPeriod().toDate()).isEqualTo(LocalDate.parse("2024-02-02"));
    }

    @Test
    void userShouldGetErrorWhenNonExistingIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/attractions/" + 100)
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
    void isCountrywideCityRegionAndCountryShouldBeUpdateWhenAttractionBelongToRegionIsChangedToBelongToCity() throws Exception {
        final String CITY_NAME = "Test city 4";
        var request = new UpdateAttractionDestinationRequest(true, null, 5);

        mockMvc.perform(put("/attractions/" + 2 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var attraction = attractionRepo.findById(2L).orElseThrow();
        assertThat(attraction.getName()).isEqualTo("Test attraction 0");
        assertThat(attraction.isCountrywide()).isTrue();
        assertThat(attraction.getCountry().getName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(attraction.getRegion().getName()).isEqualTo(REGION_NAME_1);
        assertThat(attraction.getCity().map(City::getName)).hasValue(CITY_NAME);
    }

    @Test
    void regionAndCountryShouldBeUpdateWhenAttractionBelongToCityIsChangedToBelongToRegion() throws Exception {
        final String REGION_NAME = "Test region 4";
        final String COUNTRY_NAME = "Test country 4";
        var updateRequest = new UpdateAttractionDestinationRequest(true, 5, null);

        mockMvc.perform(put("/attractions/" + 1 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        var attraction = attractionRepo.findById(1L).orElseThrow();
        assertThat(attraction.getName()).isEqualTo("Test attraction 0");
        assertThat(attraction.isCountrywide()).isTrue();
        assertThat(attraction.getCountry().getName()).isEqualTo(COUNTRY_NAME);
        assertThat(attraction.getRegion().getName()).isEqualTo(REGION_NAME);
        assertThat(attraction.getCity()).isEmpty();
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenRequiredFieldsAreNull() throws Exception {
        String[] expectedErrorMessages = {"isCountrywide = must not be null", "regionIdOrCityId = regionId or cityId is required"};
        var updateRequest = new UpdateAttractionDestinationRequest(null, null, null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder(expectedErrorMessages);
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenBothCityAndRegionIdAreSent() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, 0, 0);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{regionIdAndCityId = regionId and cityId cannot be present simultaneously}");
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, 0, null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenCityIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, null, 100);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenAttractionAlreadyExistsInTheGivenCity() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(true, null, 1);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 2 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenRegionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, 100, null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionDestinationRequestWhenAttractionAlreadyExistsInTheRegion() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, 3, null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
    }

    @Test
    void shouldUpdateAttractionDetailRequestWhenValidDataIsSent() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Sub test attraction 0", 2L);

        mockMvc.perform(put("/attractions/" + 3 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(3L).map(Attraction::getName)).hasValue("Sub test attraction 0");
        assertThat(attractionRepo.findById(3L).flatMap(Attraction::getMain).map(Attraction::getName)).hasValue("Test attraction 0");
    }

    @Test
    void shouldUpdateAttractionDetailRequestRemovingMainAttractionWhenValidDataIsSent() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Sub test attraction 0", null);

        mockMvc.perform(put("/attractions/" + 5 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(5L).map(Attraction::getName)).hasValue("Sub test attraction 0");
        assertThat(attractionRepo.findById(5L).flatMap(Attraction::getMain)).isEmpty();
    }

    @Test
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionNameAlreadyExistsInTheRegion() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Test attraction 0", null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 3 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
    }

    @Test
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionNameAlreadyExistsInTheCity() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Test attraction 0", null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 4 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.NAME_CONFLICT);
    }

    @Test
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Test attraction new 0", null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionDetailRequestWhenMainAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Test attraction new 0", 100L);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionDetailRequestWhenMainIsInDifferentContinentThenAttraction() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest("Test attraction new 0", 1L);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 2 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidAttractionData")
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionNameIsInvalid(InvalidFieldSize input) throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest(input.attractionName(), null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1)).isEqualTo(input.errorMessages()[0]);
    }

    private static Stream<InvalidFieldSize> provideInvalidAttractionData() {
        String[] emptyStringMessage = {"attractionName = Attraction name may not be null or empty", "infoFrom = Attraction name may not be null or empty"};
        String[] tooLongStringMessage = {"attractionName = Attraction name may not be longer then 2048", "attractionAddress = Attraction address may not be longer then 512", "infoFrom = Information comes from may not be longer then 512", "tip = Tip may not be longer then 2048"};
        return Stream.of(
                new InvalidFieldSize("", "", "", "", emptyStringMessage),
                new InvalidFieldSize("   ", "   ", "   ", "    ", emptyStringMessage),
                new InvalidFieldSize("\t", "\t", "\t", "\t", emptyStringMessage),
                new InvalidFieldSize("\n", "\n", "\n", "\n", emptyStringMessage),
                new InvalidFieldSize("a".repeat(2049), "a".repeat(514), "a".repeat(2049), "a".repeat(514), tooLongStringMessage)
        );
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void shouldUpdateAttractionTraditionalWhenValidRequestIsSent(boolean isTraditional) throws Exception {
        var updateRequest = new UpdateAttractionTraditionalRequest(isTraditional);

        mockMvc.perform(put("/attractions/" + 1 + "/traditional")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).map(Attraction::isTraditional)).hasValue(isTraditional);
    }

    @Test
    void shouldReturnBadRequestForUpdateAttractionTraditionalWhenInvalidRequestIsSent() throws Exception {
        var updateRequest = new UpdateAttractionTraditionalRequest(null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/traditional")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{isTraditional = must not be null}");
    }

    @Test
    void shouldUpdateAttractionTraditionalWhenInvalidAttractionIdIsSent() throws Exception {
        var updateRequest = new UpdateAttractionTraditionalRequest(false);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/traditional")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldUpdateAttractionLocationWhenLocationIsSetupForTheFirstTime() throws Exception {
        var updateRequest = new UpdateAttractionLocationRequest("Test address, Test", new LocationDTO(10.212, 21.2155));
        mockMvc.perform(put("/attractions/" + 3 + "/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(3L).map(Attraction::getName)).hasValue("Test attraction 1");
        assertThat(attractionRepo.findById(3L).flatMap(Attraction::getAddress).map(Address::address)).hasValue("Test address, Test");
        assertThat(attractionRepo.findById(3L).flatMap(Attraction::getAddress).map(Address::location)).hasValue(new Location(10.212, 21.2155));
    }

    @Test
    void shouldRemoveAttractionLocationWhenLocationIsSetToNull() throws Exception {
        var updateRequest = new UpdateAttractionLocationRequest(null, null);

        mockMvc.perform(put("/attractions/" + 1 + "/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).flatMap(Attraction::getAddress).map(Address::address)).isEmpty();
        assertThat(attractionRepo.findById(1L).flatMap(Attraction::getAddress).map(Address::location)).isEmpty();
    }

    @Test
    void shouldRemoveOnlyAddressWhenOnlyLocationIsPresented() throws Exception {
        var updateRequest = new UpdateAttractionLocationRequest(null, new LocationDTO(10.5214, 21.2315));

        mockMvc.perform(put("/attractions/" + 1 + "/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).flatMap(Attraction::getAddress).map(Address::address)).isEmpty();
        assertThat(attractionRepo.findById(1L).flatMap(Attraction::getAddress).map(Address::location)).hasValue(new Location(10.5214, 21.2315));
    }

    @Test
    void shouldRejectUpdateAttractionLocationRequestWhenAttractionAddressDetailsAreTooLong() throws Exception {
        var updateRequest = new UpdateAttractionLocationRequest("a".repeat(514), null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{attractionAddress = Attraction address may not be longer then 512}");
    }

    @Test
    void shouldRejectUpdateAttractionLocationRequestWhenLocationDataIsOutOfBounds() throws Exception {
        var updateRequest = new UpdateAttractionLocationRequest("Test address, test", new LocationDTO(-200.0, 400.251));

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder("attractionLocation.latitude = Latitude must be between -90 and 90 to be valid", "attractionLocation.longitude = Longitude must be between -180 and 180 to be valid");
    }

    @Test
    void shouldRejectUpdateAttractionLocationRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionLocationRequest("Test address, test", null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldUpdateAttractionCategoryRequestWhenNewCategoryIsSent() throws Exception {
        var updateRequest = new UpdateAttractionCategoryRequest(AttractionCategoryDTO.CLASS_AND_WORKSHOP);

        mockMvc.perform(put("/attractions/" + 1 + "/category")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).map(Attraction::getCategory)).hasValue(AttractionCategory.CLASS_AND_WORKSHOP);
    }

    @Test
    void shouldRejectUpdateAttractionCategoryRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionCategoryRequest(AttractionCategoryDTO.CLASS_AND_WORKSHOP);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/category")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionCategoryRequestWhenCategoryNotExist() throws Exception {
        var updateRequest = new UpdateAttractionCategoryRequest(null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/category")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{attractionCategory = must not be null}");
    }

    @Test
    void shouldUpdateAttractionTypeRequestWhenNewTypeIsSent() throws Exception {
        var updateRequest = new UpdateAttractionTypeRequest(AttractionTypeDTO.IMMINENT_CHANGE);

        mockMvc.perform(put("/attractions/" + 1 + "/type")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).map(Attraction::getType)).hasValue(AttractionType.IMMINENT_CHANGE);
    }

    @Test
    void shouldRejectUpdateAttractionTypeRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionTypeRequest(AttractionTypeDTO.IMMINENT_CHANGE);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/type")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionTypeRequestWhenTypeNotExist() throws Exception {
        var updateRequest = new UpdateAttractionTypeRequest(null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/type")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{attractionType = must not be null}");
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void shouldUpdateAttractionMustVisitRequestWhenNewBooleanIsSent(boolean mustVisit) throws Exception {
        var updateRequest = new UpdateAttractionVisitRequest(mustVisit);
        mockMvc.perform(put("/attractions/" + 1 + "/visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).map(Attraction::isMustVisit)).hasValue(mustVisit);
    }

    @Test
    void shouldRejectUpdateAttractionMustVisitRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionVisitRequest(true);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionMustVisitRequestWhenTypeNotExist() throws Exception {
        var updateRequest = new UpdateAttractionVisitRequest(null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{mustVisit = must not be null}");
    }

    @Test
    void shouldUpdateAttractionTipRequestWhenNewTipIsSent() throws Exception {
        var updateRequest = new UpdateAttractionTipRequest("Test tip, test test");
        mockMvc.perform(put("/attractions/" + 3 + "/tip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(3L).map(Attraction::getName)).hasValue("Test attraction 1");
        assertThat(attractionRepo.findById(3L).flatMap(Attraction::getTip)).hasValue("Test tip, test test");
    }

    @Test
    void shouldRemoveTipFromAttractionWhenNullTipUpdateIsSent() throws Exception {
        var updateRequest = new UpdateAttractionTipRequest(null);
        mockMvc.perform(put("/attractions/" + 1 + "/tip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).flatMap(Attraction::getTip)).isEmpty();
    }

    @Test
    void shouldRejectUpdateAttractionTipRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionTipRequest("Test tip, test test");

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/tip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionTipRequestWhenNewTipIsTooLong() throws Exception {
        var updateRequest = new UpdateAttractionTipRequest("a".repeat(2049));

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/tip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("{tip = Tip may not be longer then 2048}");
    }

    @Test
    void shouldUpdateAttractionVisitPeriodWhenNewVisitPeriodIsGiven() throws Exception {
        String from = LocalDate.now().minusDays(60).toString();
        String to = LocalDate.now().minusDays(10).toString();
        var updateRequest = new UpdateAttractionVisitPeriodRequest(new DateSpanDTO(LocalDate.parse(from), LocalDate.parse(to)));

        mockMvc.perform(put("/attractions/" + 3 + "/visitPeriod")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(3L).map(Attraction::getName)).hasValue("Test attraction 1");
        assertThat(attractionRepo.findById(3L).flatMap(Attraction::getOptimalVisitPeriod)).hasValue(new VisitPeriod(LocalDate.parse(from), LocalDate.parse(to)));
    }

    @Test
    void shouldUpdateAttractionVisitPeriodWhenNullVisitPeriodIsGiven() throws Exception {
        var updateRequest = new UpdateAttractionVisitPeriodRequest(null);

        mockMvc.perform(put("/attractions/" + 1 + "/visitPeriod")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).flatMap(Attraction::getOptimalVisitPeriod)).isEmpty();
    }

    @Test
    void shouldRejectUpdateAttractionVisitPeriodRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionVisitPeriodRequest(new DateSpanDTO(LocalDate.now().minusDays(60), LocalDate.now().minusDays(10)));

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/visitPeriod")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

    @Test
    void shouldRejectUpdateAttractionVisitPeriodRequestWhenVisitPeriodNewIsGivenWithNullDate() throws Exception {
        var updateRequest = new UpdateAttractionVisitPeriodRequest(new DateSpanDTO(null, null));

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/visitPeriod")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder("optimalVisitPeriod.toDate = must not be null", "optimalVisitPeriod.fromDate = must not be null");
    }

    @Test
    void shouldUpdateAttractionInformationProviderRequestWhenNewInformationProviderIsGiven() throws Exception {
        var updateRequest = new UpdateAttractionInformationProviderRequest("test portal new", LocalDate.now());

        mockMvc.perform(put("/attractions/" + 1 + "/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(1L).map(Attraction::getName)).hasValue("Test attraction 0");
        assertThat(attractionRepo.findById(1L).map(Attraction::getInformationProvider).map(InformationProvider::sourceName)).hasValue("test portal new");
        assertThat(attractionRepo.findById(1L).map(Attraction::getInformationProvider).map(InformationProvider::recorded)).hasValue(LocalDate.now());
    }

    @Test
    void shouldRejectUpdateAttractionInformationProviderRequestWhenInformationProviderIsNull() throws Exception {
        String[] expectedMessage = {"infoRecorded = must not be null", "infoFrom = Attraction name may not be null or empty"};
        var updateRequest = new UpdateAttractionInformationProviderRequest(null, null);

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder(expectedMessage);
    }

    @ParameterizedTest
    @MethodSource("provideInvalidInfoFrom")
    void shouldRejectUpdateAttractionInformationProviderRequestWhenSourceInformationProviderIsInvalid(InvalidInfoFrom input) throws Exception {
        var updateRequest = new UpdateAttractionInformationProviderRequest(input.infoFrom(), LocalDate.now());

        var jsonResponse = mockMvc.perform(put("/attractions/" + 1 + "/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo(input.errorMessage());
    }

    private record InvalidInfoFrom(String infoFrom, String errorMessage) {
    }

    private static Stream<InvalidInfoFrom> provideInvalidInfoFrom() {
        return Stream.of(
                new InvalidInfoFrom("", "{infoFrom = Attraction name may not be null or empty}"),
                new InvalidInfoFrom("   ", "{infoFrom = Attraction name may not be null or empty}"),
                new InvalidInfoFrom("\t", "{infoFrom = Attraction name may not be null or empty}"),
                new InvalidInfoFrom("\n", "{infoFrom = Attraction name may not be null or empty}"),
                new InvalidInfoFrom("a".repeat(514), "{infoFrom = Information comes from may not be longer then 512}")
        );
    }

    @Test
    void shouldRejectUpdateAttractionInformationProviderRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionInformationProviderRequest("Test", LocalDate.now());

        var jsonResponse = mockMvc.perform(put("/attractions/" + 100 + "/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
    }

}