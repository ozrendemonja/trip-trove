package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.repo.*;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
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

    private static Stream<String> provideInvalidQueries() {
        return Stream.of("", " ", "       ", "T", "Te");
    }

    @ParameterizedTest
    @MethodSource("provideInvalidQueries")
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
    void userShouldGetConflictResponseWhenAttractionQueryNameIsTooShort(String input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "ATTRACTION")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
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

}
