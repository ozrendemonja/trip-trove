package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.*;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
public class AttractionTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME_0 = "Test continent 0";
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String REGION_NAME_0 = "Test region 0";
    public static final String REGION_NAME_1 = "Test region 1";
    public static final String CITY_NAME_0 = "Test city 0";
    public static final String CITY_NAME_1 = "Test city 1";
    public static final String CITY_NAME_2 = "Test city 2";
    public static final String TEST_ATTRACTION_MAIN_0 = "Test attraction main 0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @Autowired
    private RegionRepo regionRepo;

    @Autowired
    private CityRepo cityRepo;

    @Autowired
    private AttractionRepo attractionRepo;

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

        var city0 = new City();
        city0.setName(CITY_NAME_0);
        city0.setRegion(region0);
        city0.setId(0);
        city0.setCreatedOn(LocalDateTime.now().minusDays(3));
        cityRepo.save(city0);
        var city1 = new City();
        city1.setName(CITY_NAME_1);
        city1.setRegion(region0);
        city1.setId(1);
        city1.setCreatedOn(LocalDateTime.now().minusDays(3));
        cityRepo.save(city1);
        var city2 = new City();
        city2.setName(CITY_NAME_2);
        city2.setRegion(region0);
        city2.setId(2);
        city2.setCreatedOn(LocalDateTime.now().minusDays(3));
        cityRepo.save(city2);
        var city3 = new City();
        city3.setName(CITY_NAME_0);
        city3.setRegion(region1);
        city3.setId(3);
        city3.setCreatedOn(LocalDateTime.now().minusDays(3));
        cityRepo.save(city3);
        var city4 = new City();
        city4.setName(CITY_NAME_2);
        city4.setRegion(region1);
        city4.setId(4);
        city4.setCreatedOn(LocalDateTime.now().minusDays(1));
        cityRepo.save(city4);

        var attraction = new Attraction();
        attraction.setId(0L);
        attraction.setName(TEST_ATTRACTION_MAIN_0);
        attraction.setRegion(region3);
        attraction.setCountry(country1);
        attraction.setCategory(AttractionCategory.NATURE_AND_WILDLIFE_AREA);
        attraction.setType(AttractionType.POTENTIAL_CHANGE);
        attraction.setInformationProvider(new InformationProvider("test portal", LocalDate.now().minusDays(100)));
        attractionRepo.save(attraction);
    }


    //cannot add under attraction from different country

    @ParameterizedTest
    @MethodSource("provideValidAttractionNames")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldSaveAttractionWhenSentDataIsValid(SaveAttractionRequest attractionRequest) throws Exception {
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(attractionRequest)))
                .andExpect(status().isCreated());
// TODO Return when implement DB
//                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/regions/" + input.id()));
    }

    private static Stream<SaveAttractionRequest> provideValidAttractionNames() {
        return Stream.of(new SaveAttractionRequest(false, 0, null, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null),
                new SaveAttractionRequest(false, null, 1, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null),
                new SaveAttractionRequest(true, 1, null, "Test attraction 1", null, null, null, AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.STABLE, false, false, null, "From test_user", LocalDate.now().minusDays(22), null),
                new SaveAttractionRequest(false, null, 0, "Test attraction 2", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(21), null),
                new SaveAttractionRequest(false, 0, null, "Sub test attraction 3", 0L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, false, true, null, "From test_user", LocalDate.now().minusDays(20), null),
                new SaveAttractionRequest(false, 0, null, "Test attraction 4", null, "Test address 1, Test", null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, false, false, null, "From test_user", LocalDate.now().minusDays(19), null),
                new SaveAttractionRequest(false, 0, null, "Test attraction 5", null, null, new LocationDTO(10.921, 18.215), AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(18), null),
                new SaveAttractionRequest(true, 0, null, "Test attraction 7", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, "Test tip test", "From test_user", LocalDate.now().minusDays(16), null)
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidAttractionData")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionSaveRequestShouldBeRejectedWhenNotNullFieldsAreNull() throws Exception {
        String[] expectedMessaged = {"regionIdOrCityId = regionId or cityId is required", "isCountrywide = must not be null", "attractionName = Attraction name may not be null or empty", "attractionCategory = must not be null", "attractionType = must not be null", "infoFrom = Attraction name may not be null or empty", "infoRecorded = must not be null"};
        var request = new SaveAttractionRequest(null, null, null, null, null, null, null, null, null, false, false, null, null, null, null);
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionSaveRequestShouldBeRejectedWhenGivenNameAlreadyExistsUnderGivenCity() throws Exception {
        var request = new SaveAttractionRequest(false, null, 0, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionSaveRequestShouldBeRejectedWhenGivenNameAlreadyExistsUnderGivenCitysRegion() throws Exception {
        var request = new SaveAttractionRequest(false, 0, null, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveAttractionRequest(false, null, 0, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionSaveRequestShouldBeRejectedWhenGivenNameAlreadyExistsUnderGivenRegion() throws Exception {
        var request = new SaveAttractionRequest(false, 0, null, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

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

    // region must exist under given country
    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
    // TMP solution for non existing clear of database
    void attractionSaveRequestShouldBeRejectedWhenDuplicateAttractionNameInMainAttractionExists() throws Exception {
        var request = new SaveAttractionRequest(false, 0, null, "Test attraction 0", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(23), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        request = new SaveAttractionRequest(false, 2, null, "Sub Test attraction 2", 0L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(21), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveAttractionRequest(false, 3, null, "Sub Test attraction 2", 0L, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user", LocalDate.now().minusDays(20), null);
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionShouldBeReturnedInTwoPagesInDescendingOrderWhenNoOrderIsSent() throws Exception {
        var request = new SaveAttractionRequest(true, 2, null, "Test attraction 1", 0L, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveAttractionRequest(false, null, 0, "Test attraction 2", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user 1", LocalDate.now().minusDays(20), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(get("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[0].cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[0].isCountrywide()).isFalse();
        assertThat(response[0].mainAttractionName()).isNull();
        assertThat(response[0].attractionAddress()).isNull();
        assertThat(response[0].attractionLocation()).isNull();
        assertThat(response[0].attractionCategory()).isEqualTo(AttractionCategoryResponse.BEVERAGE_SPOT);
        assertThat(response[0].attractionType()).isEqualTo(AttractionTypeResponse.STABLE);
        assertThat(response[0].mustVisit()).isTrue();
        assertThat(response[0].isTraditional()).isFalse();
        assertThat(response[0].tip()).isNull();
        assertThat(response[0].infoFrom()).isEqualTo("From test_user 1");
        assertThat(response[0].infoRecorded()).isEqualTo(LocalDate.now().minusDays(20));
        assertThat(response[0].optimalVisitPeriod()).isNull();
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 1");
        assertThat(response[1].cityName()).isNull();
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].isCountrywide()).isTrue();
        assertThat(response[1].mainAttractionName()).isEqualTo("Test attraction main 0");
        assertThat(response[1].attractionAddress()).isEqualTo("Test address, Test");
        assertThat(response[1].attractionLocation()).isEqualTo(new LocationResponse(10.541, 8.5425));
        assertThat(response[1].attractionCategory()).isEqualTo(AttractionCategoryResponse.AIR_BASED_ACTIVITY);
        assertThat(response[1].attractionType()).isEqualTo(AttractionTypeResponse.IMMINENT_CHANGE);
        assertThat(response[1].mustVisit()).isFalse();
        assertThat(response[1].isTraditional()).isTrue();
        assertThat(response[1].tip()).isEqualTo("Tip ".repeat(54));
        assertThat(response[1].infoFrom()).isEqualTo("From test_user");
        assertThat(response[1].infoRecorded()).isEqualTo(LocalDate.now().minusDays(21));
        assertThat(response[1].optimalVisitPeriod()).isEqualTo(new DateSpanResponse(LocalDate.now().minusWeeks(10), LocalDate.now()));

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
        assertThat(response[0].attractionName()).isEqualTo("Test attraction main 0");
        assertThat(response[0].cityName()).isNull();
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[0].isCountrywide()).isFalse();
        assertThat(response[0].mainAttractionName()).isNull();
        assertThat(response[0].attractionAddress()).isNull();
        assertThat(response[0].attractionLocation()).isNull();
        assertThat(response[0].attractionCategory()).isEqualTo(AttractionCategoryResponse.NATURE_AND_WILDLIFE_AREA);
        assertThat(response[0].attractionType()).isEqualTo(AttractionTypeResponse.POTENTIAL_CHANGE);
        assertThat(response[0].mustVisit()).isFalse();
        assertThat(response[0].isTraditional()).isFalse();
        assertThat(response[0].tip()).isNull();
        assertThat(response[0].infoFrom()).isEqualTo("test portal");
        assertThat(response[0].infoRecorded()).isEqualTo(LocalDate.now().minusDays(100));
        assertThat(response[0].optimalVisitPeriod()).isNull();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionShouldBeReturnedInTwoPagesInAscendingOrderWhenASCOrderIsSent() throws Exception {
        var request = new SaveAttractionRequest(true, 2, null, "Test attraction 1", 0L, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveAttractionRequest(false, null, 0, "Test attraction 2", null, null, null, AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE, true, false, null, "From test_user 1", LocalDate.now().minusDays(20), null);
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

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
        assertThat(response[0].attractionName()).isEqualTo("Test attraction main 0");
        assertThat(response[0].cityName()).isNull();
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[0].isCountrywide()).isFalse();
        assertThat(response[0].mainAttractionName()).isNull();
        assertThat(response[0].attractionAddress()).isNull();
        assertThat(response[0].attractionLocation()).isNull();
        assertThat(response[0].attractionCategory()).isEqualTo(AttractionCategoryResponse.NATURE_AND_WILDLIFE_AREA);
        assertThat(response[0].attractionType()).isEqualTo(AttractionTypeResponse.POTENTIAL_CHANGE);
        assertThat(response[0].mustVisit()).isFalse();
        assertThat(response[0].isTraditional()).isFalse();
        assertThat(response[0].tip()).isNull();
        assertThat(response[0].infoFrom()).isEqualTo("test portal");
        assertThat(response[0].infoRecorded()).isEqualTo(LocalDate.now().minusDays(100));
        assertThat(response[0].optimalVisitPeriod()).isNull();
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 1");
        assertThat(response[1].cityName()).isNull();
        assertThat(response[1].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[1].countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response[1].isCountrywide()).isTrue();
        assertThat(response[1].mainAttractionName()).isEqualTo("Test attraction main 0");
        assertThat(response[1].attractionAddress()).isEqualTo("Test address, Test");
        assertThat(response[1].attractionLocation()).isEqualTo(new LocationResponse(10.541, 8.5425));
        assertThat(response[1].attractionCategory()).isEqualTo(AttractionCategoryResponse.AIR_BASED_ACTIVITY);
        assertThat(response[1].attractionType()).isEqualTo(AttractionTypeResponse.IMMINENT_CHANGE);
        assertThat(response[1].mustVisit()).isFalse();
        assertThat(response[1].isTraditional()).isTrue();
        assertThat(response[1].tip()).isEqualTo("Tip ".repeat(54));
        assertThat(response[1].infoFrom()).isEqualTo("From test_user");
        assertThat(response[1].infoRecorded()).isEqualTo(LocalDate.now().minusDays(21));
        assertThat(response[1].optimalVisitPeriod()).isEqualTo(new DateSpanResponse(LocalDate.now().minusWeeks(10), LocalDate.now()));

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
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[0].cityName()).isEqualTo(CITY_NAME_0);
        assertThat(response[0].regionName()).isEqualTo(REGION_NAME_0);
        assertThat(response[0].countryName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(response[0].isCountrywide()).isFalse();
        assertThat(response[0].mainAttractionName()).isNull();
        assertThat(response[0].attractionAddress()).isNull();
        assertThat(response[0].attractionLocation()).isNull();
        assertThat(response[0].attractionCategory()).isEqualTo(AttractionCategoryResponse.BEVERAGE_SPOT);
        assertThat(response[0].attractionType()).isEqualTo(AttractionTypeResponse.STABLE);
        assertThat(response[0].mustVisit()).isTrue();
        assertThat(response[0].isTraditional()).isFalse();
        assertThat(response[0].tip()).isNull();
        assertThat(response[0].infoFrom()).isEqualTo("From test_user 1");
        assertThat(response[0].infoRecorded()).isEqualTo(LocalDate.now().minusDays(20));
        assertThat(response[0].optimalVisitPeriod()).isNull();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionShouldBeDeletedWhenRequestIsSent() throws Exception {
        Integer[] attractionIds = new Integer[3];
        attractionIds[0] = 0;
        var request = new SaveAttractionRequest(true, 1, null, "Test attraction 10", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        attractionIds[1] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        request = new SaveAttractionRequest(true, 2, null, "Test attraction 10", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        attractionIds[2] = Integer.valueOf(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        for (Integer id : attractionIds) {
            mockMvc.perform(delete("/attractions/" + id.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());
        }

        assertThat(attractionRepo.findAll()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetClientErrorResponseWhenNonExistingAttractionIsRequestedToBeDeleted() throws Exception {
        mockMvc.perform(delete("/attractions/" + "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void attractionShouldBeReturnedWhenValidIdIsSent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/attractions/" + 0)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse response = mapper.readValue(jsonResponse, GetAttractionResponse.class);
        assertThat(response.attractionName()).isEqualTo("Test attraction main 0");
        assertThat(response.cityName()).isNull();
        assertThat(response.regionName()).isEqualTo(REGION_NAME_1);
        assertThat(response.countryName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(response.isCountrywide()).isFalse();
        assertThat(response.mainAttractionName()).isNull();
        assertThat(response.attractionAddress()).isNull();
        assertThat(response.attractionLocation()).isNull();
        assertThat(response.attractionCategory()).isEqualTo(AttractionCategoryResponse.NATURE_AND_WILDLIFE_AREA);
        assertThat(response.attractionType()).isEqualTo(AttractionTypeResponse.POTENTIAL_CHANGE);
        assertThat(response.mustVisit()).isFalse();
        assertThat(response.isTraditional()).isFalse();
        assertThat(response.tip()).isNull();
        assertThat(response.infoFrom()).isEqualTo("test portal");
        assertThat(response.infoRecorded()).isEqualTo(LocalDate.now().minusDays(100));
        assertThat(response.optimalVisitPeriod()).isNull();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetErrorResponseWhenNonExistingIdIsSent() throws Exception {
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void isCountrywideCityRegionAndCountryShouldBeUpdateWhenAttractionBelongToRegionIsChangedToBelongToCity() throws Exception {
        var request = new UpdateAttractionDestinationRequest(true, null, 2);
        mockMvc.perform(put("/attractions/" + 0 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        var attraction = attractionRepo.findById(0L).orElseThrow();
        assertThat(attraction.getName()).isEqualTo(TEST_ATTRACTION_MAIN_0);
        assertThat(attraction.isCountrywide()).isTrue();
        assertThat(attraction.getCountry().getName()).isEqualTo(COUNTRY_NAME_0);
        assertThat(attraction.getRegion().getName()).isEqualTo(REGION_NAME_0);
        assertThat(attraction.getCity().map(City::getName)).hasValue(CITY_NAME_2);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void regionAndCountryShouldBeUpdateWhenAttractionBelongToCityIsChangedToBelongToRegion() throws Exception {
        var request = new SaveAttractionRequest(true, null, 0, "Test attraction 1", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long attractionId = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var updateRequest = new UpdateAttractionDestinationRequest(true, 1, null);
        mockMvc.perform(put("/attractions/" + attractionId + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        var attraction = attractionRepo.findById(1L).orElseThrow();
        assertThat(attraction.getName()).isEqualTo("Test attraction 1");
        assertThat(attraction.isCountrywide()).isTrue();
        assertThat(attraction.getCountry().getName()).isEqualTo(COUNTRY_NAME_1);
        assertThat(attraction.getRegion().getName()).isEqualTo(REGION_NAME_1);
        assertThat(attraction.getCity()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenRequiredFieldsAreNull() throws Exception {
        String[] expectedErrorMessages = {"isCountrywide = must not be null", "regionIdOrCityId = regionId or cityId is required"};
        var updateRequest = new UpdateAttractionDestinationRequest(null, null, null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenBothCityAndRegionIdAreSent() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, 0, 0);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenCityIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, null, 100);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenAttractionAlreadyExistsInTheGivenCity() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(true, null, 3);
        mockMvc.perform(put("/attractions/" + 0 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        var request = new SaveAttractionRequest(true, null, 0, TEST_ATTRACTION_MAIN_0, null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        updateRequest = new UpdateAttractionDestinationRequest(false, null, 3);
        var jsonResponse = mockMvc.perform(put("/attractions/" + id + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenAttractionAlreadyExistsInTheGivenCitysRegion() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(true, null, 3);
        mockMvc.perform(put("/attractions/" + 0 + "/destination")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        var request = new SaveAttractionRequest(true, null, 0, TEST_ATTRACTION_MAIN_0, null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        updateRequest = new UpdateAttractionDestinationRequest(false, null, 4);
        var jsonResponse = mockMvc.perform(put("/attractions/" + id + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenRegionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDestinationRequest(false, 100, null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDestinationRequestWhenAttractionAlreadyExistsInTheRegion() throws Exception {
        var request = new SaveAttractionRequest(true, 0, null, TEST_ATTRACTION_MAIN_0, null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var updateRequest = new UpdateAttractionDestinationRequest(false, 3, null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + id + "/destination")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldUpdateAttractionDetailRequestWhenValidDataIsSent() throws Exception {
        var request = new SaveAttractionRequest(true, 0, null, "Test attraction 0", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var updateRequest = new UpdateAttractionDetailRequest("Sub test attraction 0", 0L);
        mockMvc.perform(put("/attractions/" + id + "/detail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(id).map(Attraction::getName)).hasValue("Sub test attraction 0");
        assertThat(attractionRepo.findById(id).flatMap(Attraction::getMain).map(Attraction::getName)).hasValue(TEST_ATTRACTION_MAIN_0);
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionNameAlreadyExistsInTheRegion() throws Exception {
        var request = new SaveAttractionRequest(true, 3, null, TEST_ATTRACTION_MAIN_0 + " unique", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var updateRequest = new UpdateAttractionDetailRequest(TEST_ATTRACTION_MAIN_0, null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + id + "/detail")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionNameAlreadyExistsInTheCity() throws Exception {
        var request = new SaveAttractionRequest(true, null, 0, TEST_ATTRACTION_MAIN_0 + " test 0", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request = new SaveAttractionRequest(true, null, 0, TEST_ATTRACTION_MAIN_0 + " test 1", null, "Test address, Test", new LocationDTO(10.541, 8.5425), AttractionCategoryDTO.AIR_BASED_ACTIVITY, AttractionTypeDTO.IMMINENT_CHANGE, false, true, "Tip ".repeat(54), "From test_user", LocalDate.now().minusDays(21), new DateSpanDTO(LocalDate.now().minusWeeks(10), LocalDate.now()));
        var mvcResult = mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = Long.parseLong(mvcResult.getResponse().getHeader("Location").split("/")[4]);

        var updateRequest = new UpdateAttractionDetailRequest(TEST_ATTRACTION_MAIN_0 + " test 0", null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + id + "/detail")
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest(TEST_ATTRACTION_MAIN_0 + " test 0", null);
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDetailRequestWhenMainAttractionIdNotExist() throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest(TEST_ATTRACTION_MAIN_0 + " test 0", 100L);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/detail")
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

    @ParameterizedTest
    @MethodSource("provideInvalidAttractionData")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldRejectUpdateAttractionDetailRequestWhenAttractionNameIsInvalid(InvalidFieldSize input) throws Exception {
        var updateRequest = new UpdateAttractionDetailRequest(input.attractionName(), null);
        var jsonResponse = mockMvc.perform(put("/attractions/" + 0 + "/detail")
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

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void shouldUpdateAttractionTraditionalWhenValidRequestIsSent() throws Exception {
        var updateRequest = new UpdateAttractionTraditionalRequest(true);
        mockMvc.perform(put("/attractions/" + 0 + "/traditional")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(attractionRepo.findById(0L).get().getName()).isEqualTo(TEST_ATTRACTION_MAIN_0);
        assertThat(attractionRepo.findById(0L).get().isTraditional()).isTrue();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
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

}
