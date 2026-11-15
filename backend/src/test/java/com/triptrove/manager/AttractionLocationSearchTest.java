package com.triptrove.manager;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.transaction.Transactional;
import org.assertj.core.groups.Tuple;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.stream.Stream;

import static com.triptrove.manager.KeysetTestFixtures.locationCursorRequest;
import static com.triptrove.manager.KeysetTestFixtures.cityCursorRequest;
import static com.triptrove.manager.KeysetTestFixtures.locationSearchRequest;
import static com.triptrove.manager.KeysetTestFixtures.readPage;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql("/db/attraction-location-search-test-data.sql")
class AttractionLocationSearchTest extends AbstractIntegrationTest {
    @Autowired
    private WebApplicationContext context;

    @Autowired
    private MockMvc apiMvc;

    private MockMvc mvc;

    @BeforeEach
    void configureMockMvc() {
        mvc = KeysetTestFixtures.mockMvc(context, 3);
    }

    @Test
    void countrySearchKeepsRegionsAndCitiesTogetherAcrossEveryPage() throws Exception {
        String path = "/search/country/1/attractions";

        var first = readPage(mvc, locationSearchRequest(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Independence Day celebrations", "Illinois", null),
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"));
        assertThat(first.get(0).path("isCountrywide").booleanValue()).isTrue();

        var second = readPage(mvc, locationCursorRequest(path, first.get(2)));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Old State Capitol", "Illinois", "Springfield"),
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));
        assertThat(second.get(0).path("changedOn").asText()).isEqualTo("2026-09-01T00:00:00");

        var third = readPage(mvc, locationCursorRequest(path, second.get(2)));
        assertThat(attractionLocations(third)).containsExactly(
                tuple("Cape Cod National Seashore", "Massachusetts", null),
                tuple("Mohawk Trail", "Massachusetts", null),
                tuple("Basketball Hall of Fame", "Massachusetts", "Springfield"));

        var fourth = readPage(mvc, locationCursorRequest(path, third.get(2)));
        assertThat(attractionLocations(fourth)).containsExactly(
                tuple("Forest Park", "Massachusetts", "Springfield"),
                tuple("EcoTarium", "Massachusetts", "Worcester"),
                tuple("Worcester Art Museum", "Massachusetts", "Worcester"));
        assertThat(fourth.get(1).path("changedOn").asText()).isEqualTo("2026-10-01T00:00:00");

        var exhausted = readPage(mvc, locationCursorRequest(path, fourth.get(2)));
        assertThat(exhausted).isEmpty();
    }

    @Test
    void regionSearchKeepsCitiesTogetherAcrossEveryPage() throws Exception {
        String path = "/search/region/1/attractions";

        var first = readPage(mvc, locationSearchRequest(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Independence Day celebrations", "Illinois", null),
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"));

        var second = readPage(mvc, cityCursorRequest(path, first.get(2)));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Old State Capitol", "Illinois", "Springfield"),
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));

        var exhausted = readPage(mvc, cityCursorRequest(path, second.get(2)));
        assertThat(exhausted).isEmpty();
    }

    @Test
    void regionContinuationWithoutACityOrRegionNameStartsAfterTheNoCityGroup() throws Exception {
        String path = "/search/region/1/attractions";
        var singleItemPages = KeysetTestFixtures.mockMvc(context, 1);
        var first = readPage(singleItemPages, get(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Independence Day celebrations", "Illinois", null));
        var anchor = first.get(0);

        var second = readPage(mvc, get(path)
                .param("attractionId", anchor.path("attractionId").asText())
                .param("updatedOn", anchor.path("changedOn").asText()));

        assertThat(attractionLocations(second)).containsExactly(
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"),
                tuple("Old State Capitol", "Illinois", "Springfield"));

        var third = readPage(mvc, cityCursorRequest(path, second.get(2)));
        assertThat(attractionLocations(third)).containsExactly(
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));

        var exhausted = readPage(mvc, cityCursorRequest(path, third.get(1)));
        assertThat(exhausted).isEmpty();
    }

    @Test
    void regionContinuationWithAnEmptyCityPreservesTimestampAndIdentifierOrdering() throws Exception {
        var singleItemPages = KeysetTestFixtures.mockMvc(context, 1);
        String path = "/search/region/2/attractions";
        var first = readPage(singleItemPages, get(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Cape Cod National Seashore", "Massachusetts", null));
        assertThat(first.get(0).path("attractionId").longValue()).isEqualTo(10L);
        assertThat(first.get(0).path("changedOn").asText()).isEqualTo("2026-09-28T12:00:00.123456");

        var second = readPage(singleItemPages, cityCursorRequest(path, first.get(0)));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Mohawk Trail", "Massachusetts", null));
        assertThat(second.get(0).path("attractionId").longValue()).isEqualTo(3L);
        assertThat(second.get(0).path("changedOn").asText()).isEqualTo("2026-09-28T12:00:00.123456");

        var third = readPage(singleItemPages, cityCursorRequest(path, second.get(0)));
        assertThat(attractionLocations(third)).containsExactly(
                tuple("Basketball Hall of Fame", "Massachusetts", "Springfield"));

        var fourth = readPage(singleItemPages, cityCursorRequest(path, third.get(0)));
        assertThat(attractionLocations(fourth)).containsExactly(
                tuple("Forest Park", "Massachusetts", "Springfield"));

        var fifth = readPage(singleItemPages, cityCursorRequest(path, fourth.get(0)));
        assertThat(attractionLocations(fifth)).containsExactly(
                tuple("EcoTarium", "Massachusetts", "Worcester"));
        assertThat(fifth.get(0).path("attractionId").longValue()).isEqualTo(1L);
        assertThat(fifth.get(0).path("changedOn").asText()).isEqualTo("2026-10-01T00:00:00");

        var sixth = readPage(singleItemPages, cityCursorRequest(path, fifth.get(0)));
        assertThat(attractionLocations(sixth)).containsExactly(
                tuple("Worcester Art Museum", "Massachusetts", "Worcester"));
        assertThat(sixth.get(0).path("attractionId").longValue()).isEqualTo(8L);
        assertThat(sixth.get(0).path("changedOn").asText()).isEqualTo("2026-09-28T12:00:00.123456");

        var exhausted = readPage(singleItemPages, cityCursorRequest(path, sixth.get(0)));
        assertThat(exhausted).isEmpty();
    }

    @Test
    void regionCityCursorSurvivesADeletedAnchorAndCanBeReplayed() throws Exception {
        String path = "/search/region/1/attractions";
        var first = readPage(mvc, get(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Independence Day celebrations", "Illinois", null),
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"));
        var anchor = first.get(2);
        entityManager.createNativeQuery("DELETE FROM attraction WHERE id = :id")
                .setParameter("id", anchor.path("attractionId").longValue()).executeUpdate();

        var second = readPage(mvc, cityCursorRequest(path, anchor));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Old State Capitol", "Illinois", "Springfield"),
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));

        var exhausted = readPage(mvc, cityCursorRequest(path, second.get(2)));
        assertThat(exhausted).isEmpty();

        var replay = readPage(mvc, cityCursorRequest(path, anchor));
        assertThat(replay).isEqualTo(second);
    }

    @Test
    void deletedAnchorAndRetriesKeepTheCapturedCountryCursor() throws Exception {
        String path = "/search/country/1/attractions";
        var first = readPage(mvc, locationSearchRequest(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Independence Day celebrations", "Illinois", null),
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"));
        var anchor = first.get(2);
        entityManager.createNativeQuery("DELETE FROM attraction WHERE id = :id")
                .setParameter("id", anchor.path("attractionId").longValue()).executeUpdate();

        var second = readPage(mvc, locationCursorRequest(path, anchor));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Old State Capitol", "Illinois", "Springfield"),
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));

        var third = readPage(mvc, locationCursorRequest(path, second.get(2)));
        assertThat(attractionLocations(third)).containsExactly(
                tuple("Cape Cod National Seashore", "Massachusetts", null),
                tuple("Mohawk Trail", "Massachusetts", null),
                tuple("Basketball Hall of Fame", "Massachusetts", "Springfield"));

        var fourth = readPage(mvc, locationCursorRequest(path, third.get(2)));
        assertThat(attractionLocations(fourth)).containsExactly(
                tuple("Forest Park", "Massachusetts", "Springfield"),
                tuple("EcoTarium", "Massachusetts", "Worcester"),
                tuple("Worcester Art Museum", "Massachusetts", "Worcester"));

        var exhausted = readPage(mvc, locationCursorRequest(path, fourth.get(2)));
        assertThat(exhausted).isEmpty();

        var replay = readPage(mvc, locationCursorRequest(path, anchor));
        assertThat(replay).isEqualTo(second);
    }

    @Test
    void deletedAnchorAndRetriesKeepTheCapturedRegionCursorWithAnExtraRegionName() throws Exception {
        String path = "/search/region/1/attractions";
        var first = readPage(mvc, locationSearchRequest(path));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Independence Day celebrations", "Illinois", null),
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"));
        var anchor = first.get(2);
        entityManager.createNativeQuery("DELETE FROM attraction WHERE id = :id")
                .setParameter("id", anchor.path("attractionId").longValue()).executeUpdate();

        var second = readPage(mvc, locationCursorRequest(path, anchor));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Old State Capitol", "Illinois", "Springfield"),
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));

        var exhausted = readPage(mvc, locationCursorRequest(path, second.get(2)));
        assertThat(exhausted).isEmpty();

        var replay = readPage(mvc, locationCursorRequest(path, anchor));
        assertThat(replay).isEqualTo(second);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/search/country/1/attractions", "/search/region/1/attractions"})
    void locationFiltersApplyBeforePagination(String path) throws Exception {
        var first = readPage(mvc, locationSearchRequest(path)
                .param("isCountrywide", "false").param("mustVisit", "true"));
        assertThat(attractionLocations(first)).containsExactly(
                tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                tuple("Dana-Thomas House", "Illinois", "Springfield"),
                tuple("Old State Capitol", "Illinois", "Springfield"));

        var second = readPage(mvc, locationCursorRequest(path, first.get(2))
                .param("isCountrywide", "false").param("mustVisit", "true"));
        assertThat(attractionLocations(second)).containsExactly(
                tuple("Spurlock Museum", "Illinois", "Urbana"),
                tuple("Meadowbrook Park", "Illinois", "Urbana"));

        var exhausted = readPage(mvc, locationCursorRequest(path, second.get(1))
                .param("isCountrywide", "false").param("mustVisit", "true"));
        assertThat(exhausted).isEmpty();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("noCityCursorTraversals")
    void cursorWithoutACityTraversesEveryRemainingAttraction(String path, List<Tuple> expectedAttractions) throws Exception {
        var singleItemPages = KeysetTestFixtures.mockMvc(context, 1);
        var request = locationSearchRequest(path);

        for (var expectedAttraction : expectedAttractions) {
            var page = readPage(singleItemPages, request);
            assertThat(attractionLocations(page)).containsExactly(expectedAttraction);
            var anchor = page.get(0);
            request = locationCursorRequest(path, anchor);
        }

        var exhausted = readPage(singleItemPages, request);
        assertThat(exhausted).isEmpty();
    }

    private static Stream<Arguments> noCityCursorTraversals() {
        return Stream.of(
                Arguments.of("/search/country/1/attractions", List.of(
                        tuple("Independence Day celebrations", "Illinois", null),
                        tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                        tuple("Dana-Thomas House", "Illinois", "Springfield"),
                        tuple("Old State Capitol", "Illinois", "Springfield"),
                        tuple("Spurlock Museum", "Illinois", "Urbana"),
                        tuple("Meadowbrook Park", "Illinois", "Urbana"),
                        tuple("Cape Cod National Seashore", "Massachusetts", null),
                        tuple("Mohawk Trail", "Massachusetts", null),
                        tuple("Basketball Hall of Fame", "Massachusetts", "Springfield"),
                        tuple("Forest Park", "Massachusetts", "Springfield"),
                        tuple("EcoTarium", "Massachusetts", "Worcester"),
                        tuple("Worcester Art Museum", "Massachusetts", "Worcester"))),
                Arguments.of("/search/region/1/attractions", List.of(
                        tuple("Independence Day celebrations", "Illinois", null),
                        tuple("Lincoln Home National Historic Site", "Illinois", "Springfield"),
                        tuple("Dana-Thomas House", "Illinois", "Springfield"),
                        tuple("Old State Capitol", "Illinois", "Springfield"),
                        tuple("Spurlock Museum", "Illinois", "Urbana"),
                        tuple("Meadowbrook Park", "Illinois", "Urbana"))),
                Arguments.of("/search/region/2/attractions", List.of(
                        tuple("Cape Cod National Seashore", "Massachusetts", null),
                        tuple("Mohawk Trail", "Massachusetts", null),
                        tuple("Basketball Hall of Fame", "Massachusetts", "Springfield"),
                        tuple("Forest Park", "Massachusetts", "Springfield"),
                        tuple("EcoTarium", "Massachusetts", "Worcester"),
                        tuple("Worcester Art Museum", "Massachusetts", "Worcester"))));
    }

    @Test
    void countryContinuationRequiresTheCapturedRegionName() throws Exception {
        mvc.perform(get("/search/country/1/attractions").header("x-api-version", "1")
                        .param("attractionId", "5").param("updatedOn", KeysetTestFixtures.CHANGED_ON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "{locationCursorComplete = A grouped cursor requires the region name of the last item}"));
    }

    private static List<Tuple> attractionLocations(JsonNode page) {
        return page.valueStream()
                .map(item -> tuple(
                        item.path("attractionName").asText(),
                        item.path("regionName").asText(),
                        item.path("cityName").asText(null)))
                .toList();
    }
}
