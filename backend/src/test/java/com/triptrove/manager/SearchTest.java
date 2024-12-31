package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
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
import java.util.List;
import java.util.stream.Stream;

import static com.triptrove.manager.SuggestionDtoFactory.createSuggestionDto;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
public class SearchTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME_0 = "Test continent 0";
    public static final String CONTINENT_NAME_1 = "Test continent 1";
    public static final String CONTINENT_NAME_2 = "Continent new 2";
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String COUNTRY_NAME_2 = "New ctest 2";
    public static final String REGION_NAME_0 = "Test region 0";
    public static final String REGION_NAME_1 = "Test region 1";
    public static final String REGION_NAME_2 = "New rtest 2";
    public static final String CITY_NAME_0 = "Test city 0";
    public static final String CITY_NAME_1 = "Test city 1";
    public static final String CITY_NAME_2 = "New ctest 2";

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

    @BeforeEach
    void setupContinent() {
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

        var region0 = new Region();
        region0.setName(REGION_NAME_0);
        region0.setCountry(country0);
        region0.setId(0);
        region0.setCreatedOn(LocalDateTime.now().minusDays(4));
        regionRepo.save(region0);
        var region1 = new Region();
        region1.setName(REGION_NAME_1);
        region1.setCountry(country1);
        region1.setId(1);
        region1.setCreatedOn(LocalDateTime.now().minusDays(3));
        regionRepo.save(region1);
        var region2 = new Region();
        region2.setName(REGION_NAME_2);
        region2.setCountry(country2);
        region2.setId(2);
        region2.setCreatedOn(LocalDateTime.now().minusDays(2));
        regionRepo.save(region2);
        var region3 = new Region();
        region3.setName(REGION_NAME_0);
        region3.setCountry(country3);
        region3.setId(3);
        region3.setCreatedOn(LocalDateTime.now().minusDays(1));
        regionRepo.save(region3);

        var city0 = new City();
        city0.setName(CITY_NAME_0);
        city0.setRegion(region0);
        city0.setId(0);
        city0.setCreatedOn(LocalDateTime.now().minusDays(4));
        cityRepo.save(city0);
        var city1 = new City();
        city1.setName(CITY_NAME_1);
        city1.setRegion(region1);
        city1.setId(1);
        city1.setCreatedOn(LocalDateTime.now().minusDays(3));
        cityRepo.save(city1);
        var city2 = new City();
        city2.setName(CITY_NAME_2);
        city2.setRegion(region0);
        city2.setId(2);
        city2.setCreatedOn(LocalDateTime.now().minusDays(2));
        cityRepo.save(city2);
        var city3 = new City();
        city3.setName(CITY_NAME_2);
        city3.setRegion(region3);
        city3.setId(3);
        city3.setCreatedOn(LocalDateTime.now().minusDays(1));
        cityRepo.save(city3);
    }

    @ParameterizedTest
    @MethodSource("provideValidCountryQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void limitNumberOfSortedCountryNamesWhichGivenSearchStringIsSubstringOfWhenSearchByCountryName(QueryAndSuggestions input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input.query());
        assertThat(response.suggestions()).hasSize(input.suggestedNames().size());
        assertThat(response.suggestions()).isEqualTo(input.suggestedNames());
    }

    private record QueryAndSuggestions(String query, List<SuggestionDto> suggestedNames) {
    }

    private static Stream<QueryAndSuggestions> provideValidCountryQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto(COUNTRY_NAME_1, 4), createSuggestionDto(COUNTRY_NAME_0, 3), createSuggestionDto(COUNTRY_NAME_1, 1))),
                new QueryAndSuggestions("Test", List.of(createSuggestionDto(COUNTRY_NAME_1, 4), createSuggestionDto(COUNTRY_NAME_0, 3), createSuggestionDto(COUNTRY_NAME_1, 1))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto(COUNTRY_NAME_1, 4), createSuggestionDto(COUNTRY_NAME_0, 3), createSuggestionDto(COUNTRY_NAME_1, 1))),
                new QueryAndSuggestions("Test c", List.of(createSuggestionDto(COUNTRY_NAME_1, 4), createSuggestionDto(COUNTRY_NAME_0, 3), createSuggestionDto(COUNTRY_NAME_1, 1))),
                new QueryAndSuggestions("New", List.of(createSuggestionDto(COUNTRY_NAME_2, 2)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideValidContinentQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void limitNumberOfSortedContinentsNamesWhichGivenSearchStringIsSubstringOfWhenSearchByContinentName(QueryAndSuggestions input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "CONTINENT")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input.query());
        assertThat(response.suggestions()).hasSize(input.suggestedNames().size());
        assertThat(response.suggestions()).isEqualTo(input.suggestedNames());
    }

    private static Stream<QueryAndSuggestions> provideValidContinentQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto(CONTINENT_NAME_1, 1), createSuggestionDto(CONTINENT_NAME_0, 0))),
                new QueryAndSuggestions("Test", List.of(createSuggestionDto(CONTINENT_NAME_1, 1), createSuggestionDto(CONTINENT_NAME_0, 0))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto(CONTINENT_NAME_1, 1), createSuggestionDto(CONTINENT_NAME_0, 0))),
                new QueryAndSuggestions("Test c", List.of(createSuggestionDto(CONTINENT_NAME_1, 1), createSuggestionDto(CONTINENT_NAME_0, 0))),
                new QueryAndSuggestions("ontinent", List.of(createSuggestionDto(CONTINENT_NAME_2, 2), createSuggestionDto(CONTINENT_NAME_1, 1), createSuggestionDto(CONTINENT_NAME_0, 0))),
                new QueryAndSuggestions("new", List.of(createSuggestionDto(CONTINENT_NAME_2, 2)))
        );
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void returnEmptyListAsResultWhenGivenSearchStringIsNotSubstringOfAnyCountryName() throws Exception {
        String input = "Not valid";
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input);
        assertThat(response.suggestions()).isEmpty();
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void returnEmptyListAsResultWhenGivenSearchStringIsNotSubstringOfAnyContinentName() throws Exception {
        String input = "Not valid";
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "CONTINENT")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input);
        assertThat(response.suggestions()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("provideInValidQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetConflictResponseWhenCountryQueryNameIsTooShort(String input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    private static Stream<String> provideInValidQueries() {
        return Stream.of("", " ", "       ", "T", "Te");
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void returnEmptyListAsResultWhenGivenSearchStringIsNotSubstringOfAnyRegionName() throws Exception {
        String input = "Not valid";
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input);
        assertThat(response.suggestions()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("provideInValidQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetConflictResponseWhenRegionQueryNameIsTooShort(String input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @ParameterizedTest
    @MethodSource("provideValidRegionQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void limitNumberOfSortedRegionNamesWhichGivenSearchStringIsSubstringOfWhenSearchByRegionName(QueryAndSuggestions input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input.query());
        assertThat(response.suggestions()).hasSize(input.suggestedNames().size());
        assertThat(response.suggestions()).isEqualTo(input.suggestedNames());
    }

    private static Stream<QueryAndSuggestions> provideValidRegionQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto(REGION_NAME_0, 3), createSuggestionDto(REGION_NAME_1, 1), createSuggestionDto(REGION_NAME_0, 0))),
                new QueryAndSuggestions("Test", List.of(createSuggestionDto(REGION_NAME_0, 3), createSuggestionDto(REGION_NAME_1, 1), createSuggestionDto(REGION_NAME_0, 0))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto(REGION_NAME_0, 3), createSuggestionDto(REGION_NAME_1, 1), createSuggestionDto(REGION_NAME_0, 0))),
                new QueryAndSuggestions("Test r", List.of(createSuggestionDto(REGION_NAME_0, 3), createSuggestionDto(REGION_NAME_1, 1), createSuggestionDto(REGION_NAME_0, 0))),
                new QueryAndSuggestions("New", List.of(createSuggestionDto(REGION_NAME_2, 2)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideValidCityQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void limitNumberOfSortedCityNamesWhichGivenSearchStringIsSubstringOfWhenSearchByCityName(QueryAndSuggestions input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "CITY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input.query());
        assertThat(response.suggestions()).hasSize(input.suggestedNames().size());
        assertThat(response.suggestions()).isEqualTo(input.suggestedNames());
    }

    private static Stream<QueryAndSuggestions> provideValidCityQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto(CITY_NAME_1, 1), createSuggestionDto(CITY_NAME_0, 0))),
                new QueryAndSuggestions("Test", List.of(createSuggestionDto(CITY_NAME_1, 1), createSuggestionDto(CITY_NAME_0, 0))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto(CITY_NAME_1, 1), createSuggestionDto(CITY_NAME_0, 0))),
                new QueryAndSuggestions("Test c", List.of(createSuggestionDto(CITY_NAME_1, 1), createSuggestionDto(CITY_NAME_0, 0))),
                new QueryAndSuggestions("New", List.of(createSuggestionDto(CITY_NAME_2, 3), createSuggestionDto(CITY_NAME_2, 2)))
        );
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void returnEmptyListAsResultWhenGivenSearchStringIsNotSubstringOfAnyCityName() throws Exception {
        String input = "Not valid";
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "CITY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input);
        assertThat(response.suggestions()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("provideInValidQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetConflictResponseWhenCityQueryNameIsTooShort(String input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "CITY")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

}
