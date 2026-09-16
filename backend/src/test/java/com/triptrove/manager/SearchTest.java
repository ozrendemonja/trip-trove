package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.repo.*;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static com.triptrove.manager.SuggestionDtoFactory.createSuggestionDto;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class SearchTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String REGION_NAME_2 = "Test region 2";
    public static final String REGION_NAME_3 = "Test region 3";
    public static final String REGION_NAME_4 = "Test region 4";
    public static final String CITY_NAME_4_3 = "Test city 4";
    public static final String CITY_NAME_4_2 = "Test city 4";
    public static final String CITY_NAME_3 = "Test city 3";

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

    @ParameterizedTest
    @MethodSource("provideValidCountryQueries")
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
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto("Test country 4", 5), createSuggestionDto("Test country 3", 4), createSuggestionDto("Test country 2", 3))),
                new QueryAndSuggestions("test", List.of(createSuggestionDto("Test country 4", 5), createSuggestionDto("Test country 3", 4), createSuggestionDto("Test country 2", 3))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto("Test country 4", 5), createSuggestionDto("Test country 3", 4), createSuggestionDto("Test country 2", 3))),
                new QueryAndSuggestions("country 4", List.of(createSuggestionDto("Test country 4", 5)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideValidContinentQueries")
    void limitedNumberOfSortedContinentsNamesWhichGivenSearchStringIsSubstringOfIsReturnedWhenSearchByContinentName(QueryAndSuggestions input) throws Exception {
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
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto("Test continent 0", 1), createSuggestionDto("Test continent 3", 4), createSuggestionDto("Test continent 1", 2))),
                new QueryAndSuggestions("test", List.of(createSuggestionDto("Test continent 0", 1), createSuggestionDto("Test continent 3", 4), createSuggestionDto("Test continent 1", 2))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto("Test continent 0", 1), createSuggestionDto("Test continent 3", 4), createSuggestionDto("Test continent 1", 2))),
                new QueryAndSuggestions("ontinent 3", List.of(createSuggestionDto("Test continent 3", 4)))
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"CONTINENT", "COUNTRY", "REGION", "CITY", "ATTRACTION", "MAIN_ATTRACTION"})
    void returnEmptyListOfSuggestionsWhenGivenSearchStringIsNotSubstringOfAnyName(String searchIn) throws Exception {
        String input = "Not valid";

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", searchIn)
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
    @MethodSource("provideInvalidQueries")
    void userShouldGetConflictResponseWhenCountryQueryNameIsTooShort(InvalidQuery input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).startsWith("{").endsWith("}");
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; "))
                .containsExactlyInAnyOrder(input.errorMessages());
    }

    private record InvalidQuery(String query, String[] errorMessages) {
    }

    private static Stream<InvalidQuery> provideInvalidQueries() {
        String tooShort = "query = Query string must be at least 3 characters long";
        String blank = "query = must not be blank";
        return Stream.of(
                new InvalidQuery("", new String[]{tooShort, blank}),
                new InvalidQuery(" ", new String[]{tooShort, blank}),
                new InvalidQuery("       ", new String[]{blank}),
                new InvalidQuery("T", new String[]{tooShort}),
                new InvalidQuery("Te", new String[]{tooShort}));
    }

    @ParameterizedTest
    @MethodSource("provideInvalidQueries")
    void userShouldGetConflictResponseWhenRegionQueryNameIsTooShort(InvalidQuery input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).startsWith("{").endsWith("}");
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; "))
                .containsExactlyInAnyOrder(input.errorMessages());
    }

    @ParameterizedTest
    @MethodSource("provideValidRegionQueries")
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

    @Test
    void listOfRegionNamesWhichGivenSearchStringIsSubstringOfUnderGivenCountryWhenSearchByRegionNameAndCountryId() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "Tes")
                        .param("i", "REGION")
                        .param("cid", "2")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo("Tes");
        assertThat(response.suggestions()).hasSize(1);
        assertThat(response.suggestions().getFirst()).isEqualTo(new SuggestionDto("Test region 2", 3, StrategyApiType.RANK));
    }

    @Test
    void shouldFindCountryWhenSearchQueryContainsPlainAsciiLetterS() throws Exception {
        Country country = new Country();
        country.setName("Senegal");
        country.setIsoCode("sn");
        country.setContinent(continentRepo.findByName("Test continent 0").orElseThrow());
        countryRepo.saveAndFlush(country);

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "Sen")
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions())
                .extracting(SuggestionDto::value)
                .contains("Senegal");
    }

    @ParameterizedTest
    @ValueSource(strings = {"South Italy", "south ita", "SOUTH ITALY", "South, Italy"})
    void shouldFindRegionUsingCountrySuffixBeforeApplyingSuggestionLimit(String query) throws Exception {
        Region target = createRegionInCountry("South", "Italy");

        Country otherCountry = countryRepo.findByName("Test country 0").getFirst();
        for (int index = 0; index < 12; index++) {
            Region otherRegion = new Region();
            otherRegion.setName("South " + index);
            otherRegion.setCountry(otherCountry);
            regionRepo.saveAndFlush(otherRegion);
        }

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", query)
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions()).containsExactly(
                new SuggestionDto("South, Italy", target.getId(), StrategyApiType.RANK));
    }

    @ParameterizedTest
    @MethodSource("provideMatchingRegionAndCountryQueries")
    void shouldSuggestRegionsMatchingRegionAndCountryTerms(String regionName, String countryName, String query) throws Exception {
        Region target = createRegionInCountry(regionName, countryName);

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", query)
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(query);
        assertThat(response.suggestions()).containsExactly(new SuggestionDto(
                regionName + ", " + countryName, target.getId(), StrategyApiType.RANK));
    }

    @ParameterizedTest
    @MethodSource("provideMatchingRegionAndCountryQueries")
    void shouldSuggestRegionsMatchingRegionAndCountryTermsWithinCountry(String regionName, String countryName, String query) throws Exception {
        Region target = createRegionInCountry(regionName, countryName);

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", query)
                        .param("i", "REGION")
                        .param("cid", target.getCountry().getId().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(query);
        assertThat(response.suggestions()).containsExactly(new SuggestionDto(
                regionName, target.getId(), StrategyApiType.RANK));
    }

    @ParameterizedTest
    @MethodSource("provideNonMatchingRegionAndCountryQueries")
    void shouldReturnNoRegionSuggestionsForUnmatchedTerms(String regionName, String countryName, String query) throws Exception {
        Region target = createRegionInCountry(regionName, countryName);

        var unscopedJsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", query)
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse unscopedResponse = mapper.readValue(unscopedJsonResponse, GetSearchResponse.class);
        assertThat(unscopedResponse.prefix()).isEqualTo(query);
        assertThat(unscopedResponse.suggestions()).isEmpty();

        var scopedJsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", query)
                        .param("i", "REGION")
                        .param("cid", target.getCountry().getId().toString())
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse scopedResponse = mapper.readValue(scopedJsonResponse, GetSearchResponse.class);
        assertThat(scopedResponse.prefix()).isEqualTo(query);
        assertThat(scopedResponse.suggestions()).isEmpty();
    }

    private static Stream<Arguments> provideMatchingRegionAndCountryQueries() {
        return Stream.of(
                Arguments.of("South Western Coast", "United Kingdom", "South Western"),
                Arguments.of("South Western Coast", "United Kingdom", "South Western Coast"),
                Arguments.of("South Western Coast", "United Kingdom", "South United Kingdom"),
                Arguments.of("South Western Coast", "United Kingdom", "South Western Coast United Kingdom"),
                Arguments.of("South Western Coast", "United Kingdom", "South West United King"),
                Arguments.of("South Western Coast", "United Kingdom", "  SOUTH   Western,   UNITED Kingdom  "),
                Arguments.of("New Coast", "New Zealand", "New New Zealand"),
                Arguments.of("New Zealand", "Australia", "New Zealand"),
                Arguments.of("South_Zone", "Italy", "South_Zone Italy"),
                Arguments.of("South%Zone", "Italy", "South%Zone Italy"),
                Arguments.of("South!Zone", "Italy", "South!Zone Italy"),
                Arguments.of("Šumadija", "Čile", "sumadija cile")
        );
    }

    private static Stream<Arguments> provideNonMatchingRegionAndCountryQueries() {
        return Stream.of(
                Arguments.of("South Western Coast", "United Kingdom", "South Unknown"),
                Arguments.of("South Western Coast", "United Kingdom", "United Kingdom"),
                Arguments.of("South Western Coast", "United Kingdom", "United Kingdom South"),
                Arguments.of("New Coast", "New Zealand", "New Zealand"),
                Arguments.of("New Coast", "New Zealand", "New Zea"),
                Arguments.of("South", "Italy", "Italy"),
                Arguments.of("South", "Italy", "Italy South"),
                Arguments.of("South", "Italy", "South Unknown Italy"),
                Arguments.of("South", "Italy", ",,,"),
                Arguments.of("South", "Italy", "% Italy"),
                Arguments.of("South", "Italy", "_ Italy")
        );
    }

    private Region createRegionInCountry(String regionName, String countryName) {
        Country country = new Country();
        country.setName(countryName);
        country.setIsoCode("zz");
        country.setContinent(continentRepo.findByName("Test continent 0").orElseThrow());
        countryRepo.saveAndFlush(country);

        Region region = new Region();
        region.setName(regionName);
        region.setCountry(country);
        return regionRepo.saveAndFlush(region);
    }

    @ParameterizedTest
    @MethodSource("provideDiacriticNormalizationCases")
    void shouldFindCountryWhenSearchQueryUsesAsciiEquivalentOfAnyDiacritic(String storedName, String asciiQuery) throws Exception {
        Country country = new Country();
        country.setName(storedName);
        country.setIsoCode("zz");
        country.setContinent(continentRepo.findByName("Test continent 0").orElseThrow());
        countryRepo.saveAndFlush(country);

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", asciiQuery)
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions())
                .as("query '%s' should match stored name '%s'", asciiQuery, storedName)
                .extracting(SuggestionDto::value)
                .contains(storedName);
    }

    private static Stream<Arguments> provideDiacriticNormalizationCases() {
        return Stream.of(
                Arguments.of("Švedska", "Svedska"),    // š -> s
                Arguments.of("Žilina", "Zilina"),  // ž -> z
                Arguments.of("Češka", "Ceska"),      // č -> c (and š -> s)
                Arguments.of("Ćuprija", "Cuprija"),  // ć -> c
                Arguments.of("Đakovo", "Djakovo"),  // đ -> dj
                Arguments.of("Švicarska", "SVIC")     // upper case ascii query
        );
    }

    private static Stream<QueryAndSuggestions> provideValidRegionQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto(REGION_NAME_2 + ", Test country 1", 3), createSuggestionDto(REGION_NAME_4 + ", Test country 4", 5), createSuggestionDto(REGION_NAME_3 + ", Test country 2", 4))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto(REGION_NAME_2 + ", Test country 1", 3), createSuggestionDto(REGION_NAME_4 + ", Test country 4", 5), createSuggestionDto(REGION_NAME_3 + ", Test country 2", 4))),
                new QueryAndSuggestions("test r", List.of(createSuggestionDto(REGION_NAME_2 + ", Test country 1", 3), createSuggestionDto(REGION_NAME_4 + ", Test country 4", 5), createSuggestionDto(REGION_NAME_3 + ", Test country 2", 4))),
                new QueryAndSuggestions("region 4", List.of(createSuggestionDto(REGION_NAME_4 + ", Test country 4", 5)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideValidCityQueries")
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

    @Test
    void listOfCityNamesWhichGivenSearchStringIsSubstringOfUnderGivenCountryWhenSearchByCityNameAndCountryId() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "Tes")
                        .param("i", "CITY")
                        .param("cid", "2")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo("Tes");
        assertThat(response.suggestions()).hasSize(1);
        assertThat(response.suggestions().getFirst()).isEqualTo(new SuggestionDto("Test city 4", 3, StrategyApiType.RANK));
    }

    private static Stream<QueryAndSuggestions> provideValidCityQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto(CITY_NAME_4_3, 3), createSuggestionDto(CITY_NAME_4_2, 5), createSuggestionDto(CITY_NAME_3, 4))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto(CITY_NAME_4_3, 3), createSuggestionDto(CITY_NAME_4_2, 5), createSuggestionDto(CITY_NAME_3, 4))),
                new QueryAndSuggestions("test c", List.of(createSuggestionDto(CITY_NAME_4_3, 3), createSuggestionDto(CITY_NAME_4_2, 5), createSuggestionDto(CITY_NAME_3, 4))),
                new QueryAndSuggestions("city 4", List.of(createSuggestionDto(CITY_NAME_4_3, 3), createSuggestionDto(CITY_NAME_4_2, 5)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidQueries")
    void userShouldGetConflictResponseWhenCityQueryNameIsTooShort(InvalidQuery input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "CITY")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).startsWith("{").endsWith("}");
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; "))
                .containsExactlyInAnyOrder(input.errorMessages());
    }

    @ParameterizedTest
    @MethodSource("provideValidAttractionQueries")
    void limitNumberOfSortedAttractionNamesWhichGivenSearchStringIsSubstringOfWhenSearchByAttractionName(QueryAndSuggestions input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "ATTRACTION")
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

    @Test
    void listOfAttractionNamesWhichGivenSearchStringIsSubstringOfUnderGivenCountryWhenSearchByAttractionNameAndCountryId() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "Tes")
                        .param("i", "ATTRACTION")
                        .param("cid", "3")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo("Tes");
        assertThat(response.suggestions()).hasSize(1);
        assertThat(response.suggestions().getFirst()).isEqualTo(new SuggestionDto("Test attraction 2", 4, StrategyApiType.RANK));
    }

    @Test
    void onlyMainAttractionNamesWhichGivenSearchStringIsSubstringOfAreReturnedWhenOnlyMainIsSetInSearchByAttractionName() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "tes")
                        .param("i", "MAIN_ATTRACTION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo("tes");
        assertThat(response.suggestions()).containsExactlyInAnyOrder(new SuggestionDto("Test attraction 0", 1, StrategyApiType.RANK));
    }

    private static Stream<QueryAndSuggestions> provideValidAttractionQueries() {
        return Stream.of(
                new QueryAndSuggestions("Tes", List.of(createSuggestionDto("Test attraction 3", 5), createSuggestionDto("Test attraction 2", 4), createSuggestionDto("Test attraction 1", 3))),
                new QueryAndSuggestions("test", List.of(createSuggestionDto("Test attraction 3", 5), createSuggestionDto("Test attraction 2", 4), createSuggestionDto("Test attraction 1", 3))),
                new QueryAndSuggestions("Test ", List.of(createSuggestionDto("Test attraction 3", 5), createSuggestionDto("Test attraction 2", 4), createSuggestionDto("Test attraction 1", 3))),
                new QueryAndSuggestions("Test attraction 0", List.of(createSuggestionDto("Test attraction 0", 2), createSuggestionDto("Test attraction 0", 1)))
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidQueries")
    void userShouldGetConflictResponseWhenAttractionQueryNameIsTooShort(InvalidQuery input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "ATTRACTION")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
        assertThat(actual.errorMessage()).startsWith("{").endsWith("}");
        assertThat(actual.errorMessage().substring(1, actual.errorMessage().length() - 1).split("; "))
                .containsExactlyInAnyOrder(input.errorMessages());
    }

    @Test
    void listOfEmptyMainAttractionNamesWhenGivenSearchStringHasNoSubstringUnderGivenCountryId() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "tes")
                        .param("i", "MAIN_ATTRACTION")
                        .param("cid", "3")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo("tes");
        assertThat(response.suggestions()).isEmpty();
    }

    @Test
    void shouldFindRegionWhenSearchQueryUsesAsciiEquivalentOfDiacritics() throws Exception {
        Region region = new Region();
        region.setName("Šumadija");
        region.setCountry(countryRepo.findByName("Test country 0").get(0));
        regionRepo.saveAndFlush(region);

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "sumad")
                        .param("i", "REGION")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions())
                .extracting(SuggestionDto::value)
                .last()
                .isEqualTo("Šumadija, Test country 0");
    }

    @ParameterizedTest
    @MethodSource("provideDiacriticEntitySearchCases")
    void shouldFindEntityWhenSearchQueryUsesAsciiEquivalentOfDiacritics(DiacriticEntityCase testCase) throws Exception {
        testCase.setup.accept(this);

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", testCase.asciiQuery)
                        .param("i", testCase.searchIn)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions())
                .as("query '%s' on '%s' should match stored value '%s'",
                        testCase.asciiQuery, testCase.searchIn, testCase.storedValue)
                .extracting(SuggestionDto::value)
                .last()
                .isEqualTo(testCase.storedValue);
    }

    private record DiacriticEntityCase(String searchIn, String storedValue, String asciiQuery,
                                       Consumer<SearchTest> setup) {
    }

    private static Stream<DiacriticEntityCase> provideDiacriticEntitySearchCases() {
        return Stream.of(
                new DiacriticEntityCase("CITY", "Čačak", "cacak", t -> {
                    City city = new City();
                    city.setName("Čačak");
                    city.setRegion(t.regionRepo.findById(1).orElseThrow());
                    t.cityRepo.saveAndFlush(city);
                }),
                new DiacriticEntityCase("ATTRACTION", "Đakovački sajam", "djakovacki", t -> {
                    Attraction attraction = t.attractionRepo.findById(4L).orElseThrow();
                    attraction.setName("Đakovački sajam");
                    t.attractionRepo.saveAndFlush(attraction);
                }),
                new DiacriticEntityCase("MAIN_ATTRACTION", "Žička crkva", "zicka", t -> {
                    // Attraction id=1 is a main attraction (id=5 has main_attraction_id=1).
                    Attraction main = t.attractionRepo.findById(1L).orElseThrow();
                    main.setName("Žička crkva");
                    t.attractionRepo.saveAndFlush(main);
                })
        );
    }

}