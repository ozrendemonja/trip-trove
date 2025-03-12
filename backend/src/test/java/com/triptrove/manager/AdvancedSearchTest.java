package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.GetAttractionResponse;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/search-attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class AdvancedSearchTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @BeforeAll
    static void setup() {
        mapper.registerModule(new JavaTimeModule());
    }

    @Test
    void shouldReturnContinentAttractionsInTwoPagesWhenSearchForAttractionUnderGivenContinent() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/continent/Test continent 0/attractions")
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
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo("Test region 0");
        assertThat(response[1].countryName()).isEqualTo("Test country 0");

        jsonResponse = mockMvc.perform(get("/search/continent/Test continent 0/attractions")
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
        assertThat(response[0].cityName()).isEqualTo("Test city 0");
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
    }

    @ParameterizedTest
    @MethodSource("provideAttractionUris")
    void shouldReturnEmptyListWhenSearchForAttractionUnderNonExistingId(String uri) throws Exception {
        var jsonResponse = mockMvc.perform(get(uri)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("provideInvalidQueries")
    void shouldReturnErrorWhenQueryingAttractionWithTooShortQuery(InvalidQuery query) throws Exception {
        var jsonResponse = mockMvc.perform(get(query.url())
                        .param("q", query.query)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    private record InvalidQuery(String url, String query) {
    }

    private static final List<String> urls = List.of("/search/continent/a/attractions", "/search/country/100/attractions", "/search/region/100/attractions", "/search/city/100/attractions", "/search/attraction/100/attractions");

    private static List<InvalidQuery> provideInvalidQueries() {
        List<String> invalidQueries = List.of("", " ", "       ", "T", "Te");

        return urls.stream()
                .flatMap(url -> invalidQueries.stream().map(query -> new InvalidQuery(url, query)))
                .toList();
    }

    private static List<String> provideAttractionUris() {
        return urls;
    }

    @ParameterizedTest
    @MethodSource("provideAttractionFilterValues")
    void shouldReturnContinentAttractionsSatisfyingFilteringConditionsWhenSearchForAttractionUnderGivenContinent(FilteredAttraction filters) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/continent/Test continent 0/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("isCountrywide", filters.isCountrywide != null ? filters.isCountrywide.toString() : null)
                        .param("category", filters.category != null ? filters.category : null)
                        .param("type", filters.type != null ? filters.type : null)
                        .param("mustVisit", filters.mustVisit != null ? filters.mustVisit.toString() : null)
                        .param("isTraditional", filters.isTraditional != null ? filters.isTraditional.toString() : null)
                        .param("q", filters.sourceNameQuery != null ? filters.sourceNameQuery : null)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionId()).isEqualTo(filters.attractionId);
        if (filters.isCountrywide != null) {
            assertThat(response[0].isCountrywide()).isEqualTo(filters.isCountrywide);
        }
        if (filters.category != null) {
            assertThat(response[0].attractionCategory().toString()).hasToString(filters.category);
        }
        if (filters.type != null) {
            assertThat(response[0].attractionType().toString()).hasToString(filters.type);
        }
        if (filters.mustVisit != null) {
            assertThat(response[0].mustVisit()).isEqualTo(filters.mustVisit);
        }
        if (filters.isTraditional != null) {
            assertThat(response[0].isTraditional()).isEqualTo(filters.isTraditional);
        }
    }

    private record FilteredAttraction(Long attractionId, Boolean isCountrywide, String category, String type,
                                      Boolean mustVisit,
                                      Boolean isTraditional, String sourceNameQuery) {
    }

    private static Stream<FilteredAttraction> provideAttractionFilterValues() {
        return Stream.of(new FilteredAttraction(1L, true, null, null, true, true, null),
                new FilteredAttraction(4L, false, "HISTORIC_SITE", null, null, null, null),
                new FilteredAttraction(1L, null, "HISTORIC_SITE", null, true, null, null),
                new FilteredAttraction(1L, null, null, "STABLE", null, null, null),
                new FilteredAttraction(5L, null, null, null, null, null, "tional Test 4"),
                new FilteredAttraction(5L, null, null, null, null, null, "attraction 3"),
                new FilteredAttraction(5L, null, null, null, null, null, "test attraction 3"),
                new FilteredAttraction(4L, null, null, null, null, null, "tip n")
        );
    }

    @Test
    void shouldReturnCountryAttractionsInTwoPagesWhenSearchForAttractionUnderGivenCountry() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/country/1/attractions")
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
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo("Test region 0");
        assertThat(response[1].countryName()).isEqualTo("Test country 0");

        jsonResponse = mockMvc.perform(get("/search/country/1/attractions")
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
        assertThat(response[0].cityName()).isEqualTo("Test city 0");
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
    }

    @ParameterizedTest
    @MethodSource("provideAttractionFilterValues")
    void shouldReturnCountryAttractionsSatisfyingFilteringConditionsWhenSearchForAttractionUnderGivenCountry(FilteredAttraction filters) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/country/1/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("isCountrywide", filters.isCountrywide != null ? filters.isCountrywide.toString() : null)
                        .param("category", filters.category != null ? filters.category : null)
                        .param("type", filters.type != null ? filters.type : null)
                        .param("mustVisit", filters.mustVisit != null ? filters.mustVisit.toString() : null)
                        .param("isTraditional", filters.isTraditional != null ? filters.isTraditional.toString() : null)
                        .param("q", filters.sourceNameQuery != null ? filters.sourceNameQuery : null)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionId()).isEqualTo(filters.attractionId);
        if (filters.isCountrywide != null) {
            assertThat(response[0].isCountrywide()).isEqualTo(filters.isCountrywide);
        }
        if (filters.category != null) {
            assertThat(response[0].attractionCategory().toString()).hasToString(filters.category);
        }
        if (filters.type != null) {
            assertThat(response[0].attractionType().toString()).hasToString(filters.type);
        }
        if (filters.mustVisit != null) {
            assertThat(response[0].mustVisit()).isEqualTo(filters.mustVisit);
        }
        if (filters.isTraditional != null) {
            assertThat(response[0].isTraditional()).isEqualTo(filters.isTraditional);
        }
    }

    @Test
    void shouldReturnRegionAttractionsInTwoPagesWhenSearchForAttractionUnderGivenRegion() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/region/1/attractions")
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
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo("Test region 0");
        assertThat(response[1].countryName()).isEqualTo("Test country 0");

        jsonResponse = mockMvc.perform(get("/search/region/1/attractions")
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
        assertThat(response[0].cityName()).isEqualTo("Test city 0");
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
    }

    @ParameterizedTest
    @MethodSource("provideAttractionFilterValues")
    void shouldReturnRegionAttractionsSatisfyingFilteringConditionsWhenSearchForAttractionUnderGivenRegion(FilteredAttraction filters) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/region/1/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("isCountrywide", filters.isCountrywide != null ? filters.isCountrywide.toString() : null)
                        .param("category", filters.category != null ? filters.category : null)
                        .param("type", filters.type != null ? filters.type : null)
                        .param("mustVisit", filters.mustVisit != null ? filters.mustVisit.toString() : null)
                        .param("isTraditional", filters.isTraditional != null ? filters.isTraditional.toString() : null)
                        .param("q", filters.sourceNameQuery != null ? filters.sourceNameQuery : null)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionId()).isEqualTo(filters.attractionId);
        if (filters.isCountrywide != null) {
            assertThat(response[0].isCountrywide()).isEqualTo(filters.isCountrywide);
        }
        if (filters.category != null) {
            assertThat(response[0].attractionCategory().toString()).hasToString(filters.category);
        }
        if (filters.type != null) {
            assertThat(response[0].attractionType().toString()).hasToString(filters.type);
        }
        if (filters.mustVisit != null) {
            assertThat(response[0].mustVisit()).isEqualTo(filters.mustVisit);
        }
        if (filters.isTraditional != null) {
            assertThat(response[0].isTraditional()).isEqualTo(filters.isTraditional);
        }
    }

    @Test
    void shouldReturnCityAttractionsInTwoPagesWhenSearchForAttractionUnderGiveCity() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/city/3/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(2);
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 5");
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo("Test region 1");
        assertThat(response[0].countryName()).isEqualTo("Test country 1");
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 4");
        assertThat(response[1].cityName()).isEqualTo("Test city 4");
        assertThat(response[1].regionName()).isEqualTo("Test region 1");
        assertThat(response[1].countryName()).isEqualTo("Test country 1");

        jsonResponse = mockMvc.perform(get("/search/city/3/attractions")
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
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 1");
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo("Test region 1");
        assertThat(response[0].countryName()).isEqualTo("Test country 1");
    }

    @ParameterizedTest
    @MethodSource("provideCityAttractionFilterValues")
    void shouldReturnCityAttractionsSatisfyingFilteringConditionsWhenSearchForAttractionUnderGivenCity(FilteredAttraction filters) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/city/3/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("isCountrywide", filters.isCountrywide != null ? filters.isCountrywide.toString() : null)
                        .param("category", filters.category != null ? filters.category : null)
                        .param("type", filters.type != null ? filters.type : null)
                        .param("mustVisit", filters.mustVisit != null ? filters.mustVisit.toString() : null)
                        .param("isTraditional", filters.isTraditional != null ? filters.isTraditional.toString() : null)
                        .param("q", filters.sourceNameQuery != null ? filters.sourceNameQuery : null)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionId()).isEqualTo(filters.attractionId);
        if (filters.isCountrywide != null) {
            assertThat(response[0].isCountrywide()).isEqualTo(filters.isCountrywide);
        }
        if (filters.category != null) {
            assertThat(response[0].attractionCategory().toString()).hasToString(filters.category);
        }
        if (filters.type != null) {
            assertThat(response[0].attractionType().toString()).hasToString(filters.type);
        }
        if (filters.mustVisit != null) {
            assertThat(response[0].mustVisit()).isEqualTo(filters.mustVisit);
        }
        if (filters.isTraditional != null) {
            assertThat(response[0].isTraditional()).isEqualTo(filters.isTraditional);
        }
    }

    private static Stream<FilteredAttraction> provideCityAttractionFilterValues() {
        return Stream.of(
                new FilteredAttraction(7L, false, null, null, true, true, null),
                new FilteredAttraction(7L, false, null, null, null, true, null),
                new FilteredAttraction(3L, null, "ART_MUSEUM", null, null, null, null),
                new FilteredAttraction(6L, null, null, "POTENTIAL_CHANGE", false, false, null),
                new FilteredAttraction(6L, null, null, null, false, false, "t 3 "),
                new FilteredAttraction(7L, null, null, null, null, null, "ction 5"),
                new FilteredAttraction(6L, null, null, null, null, null, "st t"),
                new FilteredAttraction(7L, null, null, null, null, null, "functional Test 5")
        );
    }

    @Test
    void shouldReturnMainAttractionAttractionsInTwoPagesWhenSearchForAttractionUnderGiveCity() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/attraction/1/attractions")
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
        assertThat(response[0].regionName()).isEqualTo("Test region 0");
        assertThat(response[0].countryName()).isEqualTo("Test country 0");
        assertThat(response[0].mainAttractionName()).isEqualTo("Test attraction 0");
        assertThat(response[1].attractionName()).isEqualTo("Test attraction 2");
        assertThat(response[1].cityName()).isEqualTo("Test city 1");
        assertThat(response[1].regionName()).isEqualTo("Test region 0");
        assertThat(response[1].countryName()).isEqualTo("Test country 0");
        assertThat(response[1].mainAttractionName()).isEqualTo("Test attraction 0");

        jsonResponse = mockMvc.perform(get("/search/attraction/1/attractions")
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
        assertThat(response[0].attractionName()).isEqualTo("Test attraction 1");
        assertThat(response[0].cityName()).isEqualTo("Test city 4");
        assertThat(response[0].regionName()).isEqualTo("Test region 1");
        assertThat(response[0].countryName()).isEqualTo("Test country 1");
        assertThat(response[0].mainAttractionName()).isEqualTo("Test attraction 0");
    }

    @ParameterizedTest
    @MethodSource("provideMainAttractionFilterValues")
    void shouldReturnMainAttractionsSatisfyingFilteringConditionsWhenSearchForAttractionUnderGivenMainAttraction(FilteredAttraction filters) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search/attraction/1/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("isCountrywide", filters.isCountrywide != null ? filters.isCountrywide.toString() : null)
                        .param("category", filters.category != null ? filters.category : null)
                        .param("type", filters.type != null ? filters.type : null)
                        .param("mustVisit", filters.mustVisit != null ? filters.mustVisit.toString() : null)
                        .param("isTraditional", filters.isTraditional != null ? filters.isTraditional.toString() : null)
                        .param("q", filters.sourceNameQuery != null ? filters.sourceNameQuery : null)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetAttractionResponse[] response = mapper.readValue(jsonResponse, GetAttractionResponse[].class);
        assertThat(response).hasSize(1);
        assertThat(response[0].attractionId()).isEqualTo(filters.attractionId);
        if (filters.isCountrywide != null) {
            assertThat(response[0].isCountrywide()).isEqualTo(filters.isCountrywide);
        }
        if (filters.category != null) {
            assertThat(response[0].attractionCategory().toString()).hasToString(filters.category);
        }
        if (filters.type != null) {
            assertThat(response[0].attractionType().toString()).hasToString(filters.type);
        }
        if (filters.mustVisit != null) {
            assertThat(response[0].mustVisit()).isEqualTo(filters.mustVisit);
        }
        if (filters.isTraditional != null) {
            assertThat(response[0].isTraditional()).isEqualTo(filters.isTraditional);
        }
    }

    private static Stream<FilteredAttraction> provideMainAttractionFilterValues() {
        return Stream.of(
                new FilteredAttraction(4L, null, "HISTORIC_SITE", null, null, null, null),
                new FilteredAttraction(4L, null, null, null, null, false, "st 3"),
                new FilteredAttraction(3L, false, null, null, null, null, "Functional Test 2 n"),
                new FilteredAttraction(5L, true, null, null, null, false, null),
                new FilteredAttraction(5L, null, null, null, null, null, "on 3"),
                new FilteredAttraction(4L, null, null, null, null, null, "new f"),
                new FilteredAttraction(4L, null, null, null, null, null, "test tip")
        );
    }

}
