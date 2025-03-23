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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class AttractionSaveTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();

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

    @ParameterizedTest
    @MethodSource("provideValidAttractionNames")
    void attractionShouldBeSavedWhenSentDataIsValid(SaveAttractionRequest attractionRequest) throws Exception {
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(attractionRequest)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/attractions/" + attractionRepo.findByName(attractionRequest.attractionName()).getFirst().getId()));

        Long id = attractionRepo.findByName(attractionRequest.attractionName()).getFirst().getId();
        assertThat(attractionRepo.findById(id).map(Attraction::getName)).hasValue(attractionRequest.attractionName());
        assertThat(attractionRepo.findById(id).map(Attraction::isCountrywide)).hasValue(attractionRequest.isCountrywide());
        assertThat(attractionRepo.findById(id).map(Attraction::getRegion).map(Region::getId)).hasValue(attractionRequest.regionId() != null ? attractionRequest.regionId() : cityRepo.findById(attractionRequest.cityId()).orElseThrow().getRegion().getId());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getCity).map(City::getId).orElse(null)).isEqualTo(attractionRequest.cityId());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getMain).map(Attraction::getId).orElse(null)).isEqualTo(attractionRequest.mainAttractionId());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getAddress).map(Address::address).orElse(null)).isEqualTo(attractionRequest.attractionAddress());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getAddress).map(Address::location).map(Location::latitude).orElse(null)).isEqualTo(attractionRequest.attractionLocation() != null ? attractionRequest.attractionLocation().latitude() : null);
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getAddress).map(Address::location).map(Location::longitude).orElse(null)).isEqualTo(attractionRequest.attractionLocation() != null ? attractionRequest.attractionLocation().longitude() : null);
        assertThat(attractionRepo.findById(id).map(Attraction::getCategory).map(AttractionCategory::toString)).hasValue(attractionRequest.attractionCategory().toString());
        assertThat(attractionRepo.findById(id).map(Attraction::getType).map(AttractionType::toString)).hasValue(attractionRequest.attractionType().toString());
        assertThat(attractionRepo.findById(id).map(Attraction::isMustVisit)).hasValue(attractionRequest.mustVisit());
        assertThat(attractionRepo.findById(id).map(Attraction::isTraditional)).hasValue(attractionRequest.isTraditional());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getTip).orElse(null)).isEqualTo(attractionRequest.tip());
        assertThat(attractionRepo.findById(id).map(Attraction::getInformationProvider).map(InformationProvider::sourceName)).hasValue(attractionRequest.infoFrom());
        assertThat(attractionRepo.findById(id).map(Attraction::getInformationProvider).map(InformationProvider::recorded)).hasValue(attractionRequest.infoRecorded());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getOptimalVisitPeriod).map(VisitPeriod::from).orElse(null)).isEqualTo(attractionRequest.optimalVisitPeriod() != null ? attractionRequest.optimalVisitPeriod().fromDate() : null);
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getOptimalVisitPeriod).map(VisitPeriod::to).orElse(null)).isEqualTo(attractionRequest.optimalVisitPeriod() != null ? attractionRequest.optimalVisitPeriod().toDate() : null);
    }

    private static Stream<SaveAttractionRequest> provideValidAttractionNames() {
        return Stream.of(new SaveAttractionRequest(false, 1, null, "Test attraction 10", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null),
                new SaveAttractionRequest(false, null, 1, "Test attraction 10", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null),
                new SaveAttractionRequest(true, 1, null, "Test attraction 11", null, null, null, AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.STABLE, false, false, null, "From test_user", LocalDate.now().minusDays(22), null),
                new SaveAttractionRequest(false, null, 1, "Test attraction 12", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(21), null),
                new SaveAttractionRequest(false, 1, null, "Sub test attraction 13", 1L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, false, true, null, "From test_user", LocalDate.now().minusDays(20), null),
                new SaveAttractionRequest(false, 1, null, "Test attraction 14", null, "Test address 1, Test", null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, false, false, null, "From test_user", LocalDate.now().minusDays(19), null),
                new SaveAttractionRequest(false, 1, null, "Test attraction 15", null, null, new LocationDTO(10.921, 18.215), AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(18), null),
                new SaveAttractionRequest(true, 1, null, "Test attraction 16", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, "Test tip test", "From test_user", LocalDate.now().minusDays(16), null)
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidAttractionData")
    void attractionSaveRequestShouldBeRejectedWhenInvalidAttractionNameIsSent(InvalidFieldSize input) throws Exception {
        var request = new SaveAttractionRequest(true, 1, null, input.attractionName(), null, input.attractionAddress(), null, AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.STABLE, false, false, input.tip(), input.infoFrom(), LocalDate.now().minusDays(22), null);

        var jsonResponse = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder(input.errorMessages());
    }

    private record InvalidFieldSize(String attractionName, String attractionAddress, String tip, String infoFrom,
                                    String[] errorMessages) {
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

    @Test
    void attractionSaveRequestShouldBeRejectedWhenNotNullFieldsAreNull() throws Exception {
        String[] expectedMessaged = {"regionIdOrCityId = regionId or cityId is required", "isCountrywide = must not be null", "attractionName = Attraction name may not be null or empty", "attractionCategory = must not be null", "attractionType = must not be null", "infoFrom = Attraction name may not be null or empty", "infoRecorded = must not be null", "optimalVisitPeriod.fromDate = must not be null", "optimalVisitPeriod.toDate = must not be null"};
        var request = new SaveAttractionRequest(null, null, null, null, null, null, null, null, null, false, false, null, null, null, new DateSpanDTO(null, null));
        var jsonResponse = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();


        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder(expectedMessaged);
    }

    @Test
    void attractionSaveRequestShouldBeRejectedWhenBothRegionIdAndCityIdArePresent() throws Exception {
        String[] expectedMessaged = {"regionIdAndCityId = regionId and cityId cannot be present simultaneously", "isCountrywide = must not be null", "attractionName = Attraction name may not be null or empty", "attractionCategory = must not be null", "attractionType = must not be null", "infoFrom = Attraction name may not be null or empty", "infoRecorded = must not be null"};
        var request = new SaveAttractionRequest(null, 1, 0, null, null, null, null, null, null, false, false, null, null, null, null);

        var jsonResponse = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; ")).containsExactlyInAnyOrder(expectedMessaged);
    }

    @Test
    void attractionSaveRequestShouldBeRejectedWhenGivenRegionNotExists() throws Exception {
        var request = new SaveAttractionRequest(false, 100, null, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        var jsonResponse = mockMvc.perform(post("/attractions")
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
    void attractionSaveRequestShouldBeRejectedWhenGivenNameAlreadyExistsUnderGivenRegion() throws Exception {
        var request = new SaveAttractionRequest(false, 3, null, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);

        var jsonResponse = mockMvc.perform(post("/attractions")
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
    void attractionShouldBeSavedWhenGivenNameAlreadyExistsUnderRegionButNotUnderGivenCity() throws Exception {
        String attractionName = "Test attraction 0";
        var request = new SaveAttractionRequest(false, null, 2, attractionName, null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/attractions/" + attractionRepo.findByName(attractionName).get(1).getId()));

        Long id = attractionRepo.findByName(attractionName).get(1).getId();
        assertThat(attractionRepo.findById(id).map(Attraction::getName)).hasValue(attractionName);
        assertThat(attractionRepo.findById(id).map(Attraction::isCountrywide)).hasValue(false);
        assertThat(attractionRepo.findById(id).map(Attraction::getRegion).map(Region::getId)).hasValue(cityRepo.findById(2).orElseThrow().getRegion().getId());
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getCity).map(City::getId)).hasValue(2);
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getMain)).isEmpty();
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getAddress).map(Address::address)).isEmpty();
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getAddress).map(Address::location)).isEmpty();
        assertThat(attractionRepo.findById(id).map(Attraction::getCategory)).hasValue(AttractionCategory.BEVERAGE_SPOT);
        assertThat(attractionRepo.findById(id).map(Attraction::getType)).hasValue(AttractionType.STABLE);
        assertThat(attractionRepo.findById(id).map(Attraction::isMustVisit)).hasValue(true);
        assertThat(attractionRepo.findById(id).map(Attraction::isTraditional)).hasValue(false);
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getTip)).isEmpty();
        assertThat(attractionRepo.findById(id).map(Attraction::getInformationProvider).map(InformationProvider::sourceName)).hasValue("From test_user");
        assertThat(attractionRepo.findById(id).map(Attraction::getInformationProvider).map(InformationProvider::recorded)).hasValue(LocalDate.now().minusDays(23));
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getOptimalVisitPeriod)).isEmpty();
    }

    @Test
    void attractionSaveRequestShouldBeRejectedWhenGivenCityNotExists() throws Exception {
        var request = new SaveAttractionRequest(false, null, 100, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        var jsonResponse = mockMvc.perform(post("/attractions")
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
    void attractionSaveRequestShouldBeRejectedWhenGivenNameAlreadyExistsUnderGivenCity() throws Exception {
        var request = new SaveAttractionRequest(false, null, 1, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);

        var jsonResponse = mockMvc.perform(post("/attractions")
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
    void attractionShouldBeSavedWhenGivenNameAlreadyExistsUnderCityButNotUnderGivenRegion() throws Exception {
        String attractionName = "Test attraction 0";
        var request = new SaveAttractionRequest(false, 2, null, attractionName, null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/attractions/" + attractionRepo.findByName(attractionName).get(1).getId()));
    }

    @Test
    void attractionSaveRequestShouldBeRejectedWhenGivenMainAttractionNotExists() throws Exception {
        var request = new SaveAttractionRequest(false, null, 0, "Test attraction 0", 100L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        var jsonResponse = mockMvc.perform(post("/attractions")
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
    void attractionSaveRequestShouldBeRejectedWhenMainAttractionAlreadyContainsGivenAttractionName() throws Exception {
        var request = new SaveAttractionRequest(false, 2, null, "Sub Test attraction 2", 1L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(21), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveAttractionRequest(false, 4, null, "Sub Test attraction 2", 1L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(20), null);
        var jsonResponse = mockMvc.perform(post("/attractions")
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
    void attractionSaveRequestShouldBeRejectedWhenMainAttractionIsInDifferentContinentThenAttraction() throws Exception {
        var request = new SaveAttractionRequest(false, 5, null, "Sub Test attraction 2", 1L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(20), null);

        var jsonResponse = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).isEqualTo("Action cannot be performed due to constraint violations");
    }

}