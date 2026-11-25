package com.triptrove.manager;

import com.fasterxml.jackson.databind.JsonNode;
import com.triptrove.manager.KeysetTestFixtures.CursorRoute;
import com.triptrove.manager.KeysetTestFixtures.Workflow;
import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.domain.model.BucketListStatusFilter;
import com.triptrove.manager.domain.model.SearchInElement;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.domain.service.SearchService;
import com.triptrove.manager.domain.service.TripService;
import io.hypersistence.utils.jdbc.validator.SQLStatementCountMismatchException;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.triptrove.manager.KeysetTestFixtures.nextPageRequest;
import static com.triptrove.manager.KeysetTestFixtures.cityCursorRequest;
import static com.triptrove.manager.KeysetTestFixtures.locationCursorRequest;
import static com.triptrove.manager.KeysetTestFixtures.locationSearchRequest;
import static com.triptrove.manager.KeysetTestFixtures.readPage;
import static io.hypersistence.utils.jdbc.validator.SQLStatementCountValidator.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql("/db/attractions-test-data.sql")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SqlQueryCountTest extends AbstractIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AttractionRepo attractionRepo;

    @Autowired
    private BucketListItemRepo bucketListItemRepo;

    @Autowired
    private CityRepo cityRepo;

    @Autowired
    private RegionRepo regionRepo;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private TripRepo tripRepo;

    @Autowired
    private ItineraryRepo itineraryRepo;

    @Autowired
    private JsonMapper mapper;

    @Autowired
    private SearchService searchService;

    @Autowired
    private TripService tripService;

    @ParameterizedTest(name = "{0}, blank cursor ''{2}'', SELECTs {3}")
    @CsvSource({
            "/countries, countryId, '', 1",
            "/countries, countryId, '   ', 1",
            "/attractions, attractionId, '', 1",
            "/attractions, attractionId, '   ', 1",
            "/search/country/1/attractions, attractionId, '', 2",
            "/search/country/1/attractions, attractionId, '   ', 2"
    })
    void blankCursorsUseExpectedSelectCount(
            String path, String identifierField, String value, int expectedSelects) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1")
                        .param(identifierField, value).param("updatedOn", value))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        assertReadOnlySelectCount(expectedSelects);
    }

    @ParameterizedTest
    @CsvSource({"/countries, ''", "/countries, '   '", "/attractions, ''", "/attractions, '   '"})
    void blankSortDirectionsUseOneSelect(String path, String direction) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1").param("sd", direction))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}, repeated sd={1}")
    @MethodSource("repeatedDirections")
    void repeatedSortDirectionsUseOneSelect(String path, String direction) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1").param("sd", direction, direction))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        assertReadOnlySelectCount(1);
    }

    private static Stream<Arguments> repeatedDirections() {
        return Stream.of("/countries", "/regions", "/cities", "/attractions", "/trips", "/bucket-list/items")
                .flatMap(path -> Stream.of("ASC", "DESC").map(direction -> Arguments.of(path, direction)));
    }

    @ParameterizedTest(name = "{0}, cursor ID {1}")
    @MethodSource("wideCursors")
    void emptyPagesWithLongCursorIdsUseOneSelect(CursorRoute route, String identifier) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(route.path()).header("x-api-version", "1")
                        .param(route.idField(), identifier).param("updatedOn", "1900-01-01T00:00:00.123456")
                        .param("regionName", "zzzz").param("cityName", "zzzz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    private static Stream<Arguments> wideCursors() {
        return KeysetTestFixtures.cursorRoutes().filter(route -> route.idType().equals("Long"))
                .flatMap(route -> Stream.of("2147483647", "2147483648")
                        .map(identifier -> Arguments.of(route, identifier)));
    }

    @ParameterizedTest(name = "{0}, page size {1}, matches {2}, results {3}, SELECTs {4}")
    @MethodSource({"listFirstPages", "searchFirstPages"})
    void firstPageUsesExpectedSelectCount(
            Workflow workflow, int pageSize, int matchingSize, int resultSize, int expectedSelects) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        resetSqlStatementCounts();

        mvc.perform(workflow.request().header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(expectedSelects);
    }

    private static Stream<Arguments> listFirstPages() {
        return firstPageSizes(KeysetTestFixtures.listWorkflows(), 1);
    }

    private static Stream<Arguments> searchFirstPages() {
        return firstPageSizes(KeysetTestFixtures.searchWorkflows(), 2);
    }

    @ParameterizedTest(name = "{0}, page size {2}, matches {3}")
    @MethodSource("locationSearchPages")
    void locationGroupedFirstPagesUseTwoSelects(
            String path, BiConsumer<EntityManager, Integer> fixture, int pageSize, int matchingSize,
            BiFunction<String, JsonNode, MockHttpServletRequestBuilder> cursorRequest) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        fixture.accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        resetSqlStatementCounts();

        mvc.perform(locationSearchRequest(path).param("q", "Keyset attraction").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pageSize));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest(name = "{0}, page size {2}, matches {3}")
    @MethodSource("locationSearchPages")
    void locationGroupedContinuationAndReplayUseTwoSelects(
            String path, BiConsumer<EntityManager, Integer> fixture, int pageSize, int matchingSize,
            BiFunction<String, JsonNode, MockHttpServletRequestBuilder> cursorRequest) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        fixture.accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        var first = readPage(mvc, locationSearchRequest(path).param("q", "Keyset attraction"));
        assertThat(first.size()).isEqualTo(pageSize);
        var anchor = first.get(pageSize - 1);
        resetSqlStatementCounts();

        mvc.perform(cursorRequest.apply(path, anchor).param("q", "Keyset attraction").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pageSize));

        assertReadOnlySelectCount(2);
        resetSqlStatementCounts();

        mvc.perform(cursorRequest.apply(path, anchor).param("q", "Keyset attraction").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pageSize));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest(name = "{0}, page size {2}, matches {3}")
    @MethodSource("locationSearchPages")
    void locationGroupedDeletedCursorsUseTwoSelects(
            String path, BiConsumer<EntityManager, Integer> fixture, int pageSize, int matchingSize,
            BiFunction<String, JsonNode, MockHttpServletRequestBuilder> cursorRequest) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        fixture.accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        var first = readPage(mvc, locationSearchRequest(path).param("q", "Keyset attraction"));
        assertThat(first.size()).isEqualTo(pageSize);
        var anchor = first.get(pageSize - 1);
        entityManager.createNativeQuery("DELETE FROM attraction WHERE id = :id")
                .setParameter("id", anchor.path("attractionId").longValue()).executeUpdate();
        resetSqlStatementCounts();

        mvc.perform(cursorRequest.apply(path, anchor).param("q", "Keyset attraction").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pageSize));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/search/country/1/attractions", "/search/region/1/attractions"})
    void emptyLocationGroupedSearchUsesOneSelect(String path) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(locationSearchRequest(path).param("q", "Keyset attraction").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}, matches {3}")
    @MethodSource("locationSearchPages")
    void exhaustedLocationGroupedCursorsUseOneSelect(
            String path, BiConsumer<EntityManager, Integer> fixture, int pageSize, int matchingSize,
            BiFunction<String, JsonNode, MockHttpServletRequestBuilder> cursorRequest) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        fixture.accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, matchingSize);
        var first = readPage(mvc, locationSearchRequest(path).param("q", "Keyset attraction"));
        assertThat(first.size()).isEqualTo(matchingSize);
        var anchor = first.get(matchingSize - 1);
        resetSqlStatementCounts();

        mvc.perform(cursorRequest.apply(path, anchor).param("q", "Keyset attraction").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 20})
    void regionCursorsWithoutACityOrRegionNameUseTwoSelects(int pageSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.regionalLocationAttractions(entityManager, pageSize + 1);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        resetSqlStatementCounts();

        mvc.perform(get("/search/region/1/attractions").header("x-api-version", "1")
                        .param("q", "Keyset attraction")
                        .param("attractionId", "1").param("updatedOn", KeysetTestFixtures.CHANGED_ON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pageSize));

        assertReadOnlySelectCount(2);
    }

    private static Stream<Arguments> locationSearchPages() {
        BiConsumer<EntityManager, Integer> country = KeysetTestFixtures::locationAttractions;
        BiConsumer<EntityManager, Integer> region = KeysetTestFixtures::regionalLocationAttractions;
        BiFunction<String, JsonNode, MockHttpServletRequestBuilder> countryCursor = KeysetTestFixtures::locationCursorRequest;
        BiFunction<String, JsonNode, MockHttpServletRequestBuilder> regionCursor = KeysetTestFixtures::cityCursorRequest;
        return Stream.of(
                Arguments.of("/search/country/1/attractions", country, 2, 5, countryCursor),
                Arguments.of("/search/country/1/attractions", country, 20, 41, countryCursor),
                Arguments.of("/search/region/1/attractions", region, 2, 5, regionCursor),
                Arguments.of("/search/region/1/attractions", region, 20, 41, regionCursor));
    }

    private static Stream<Arguments> firstPageSizes(Stream<Workflow> workflows, int expectedSelects) {
        return workflows.flatMap(workflow -> Stream.of(
                Arguments.of(workflow, 1, 2, 1, expectedSelects),
                Arguments.of(workflow, 2, 1, 1, expectedSelects),
                Arguments.of(workflow, 20, 20, 20, expectedSelects),
                Arguments.of(workflow, 100, 101, 100, expectedSelects)));
    }

    @ParameterizedTest(name = "{0}, page size {1}, matches {2}, results {3}, SELECTs {4}")
    @MethodSource({"listContinuationPages", "searchContinuationPages"})
    void continuationUsesExpectedSelectCount(
            Workflow workflow, int pageSize, int matchingSize, int resultSize, int expectedSelects) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        var firstPage = readPage(mvc, workflow.request());
        assertThat(firstPage.size()).isEqualTo(pageSize);
        resetSqlStatementCounts();

        mvc.perform(nextPageRequest(workflow, firstPage).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(expectedSelects);
    }

    private static Stream<Arguments> listContinuationPages() {
        return continuationPageSizes(KeysetTestFixtures.listWorkflows(), 1);
    }

    private static Stream<Arguments> searchContinuationPages() {
        return continuationPageSizes(KeysetTestFixtures.searchWorkflows(), 2);
    }

    private static Stream<Arguments> continuationPageSizes(Stream<Workflow> workflows, int expectedSelects) {
        return workflows.flatMap(workflow -> Stream.of(
                Arguments.of(workflow, 1, 3, 1, expectedSelects),
                Arguments.of(workflow, 2, 5, 2, expectedSelects),
                Arguments.of(workflow, 20, 41, 20, expectedSelects),
                Arguments.of(workflow, 100, 201, 100, expectedSelects)));
    }

    @ParameterizedTest(name = "{0}, page size {1}, matches {2}, results {3}, SELECTs {4}")
    @MethodSource({"listContinuationPages", "searchContinuationPages"})
    void replayedCursorUsesExpectedSelectCount(
            Workflow workflow, int pageSize, int matchingSize, int resultSize, int expectedSelects) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        var firstPage = readPage(mvc, workflow.request());
        assertThat(firstPage.size()).isEqualTo(pageSize);
        readPage(mvc, nextPageRequest(workflow, firstPage));
        resetSqlStatementCounts();

        mvc.perform(nextPageRequest(workflow, firstPage).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(expectedSelects);
    }

    @ParameterizedTest(name = "{0}, page size {1}, matches {2}, results {3}, SELECTs {4}")
    @MethodSource({"listContinuationPages", "searchContinuationPages"})
    void deletedCursorUsesExpectedSelectCount(
            Workflow workflow, int pageSize, int matchingSize, int resultSize, int expectedSelects) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, matchingSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        var firstPage = readPage(mvc, workflow.request());
        assertThat(firstPage.size()).isEqualTo(pageSize);
        var anchor = firstPage.get(pageSize - 1).path(workflow.responseField()).longValue();
        KeysetTestFixtures.deleteAnchor(entityManager, workflow, anchor);
        resetSqlStatementCounts();

        mvc.perform(nextPageRequest(workflow, firstPage).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(expectedSelects);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allWorkflows")
    void emptyFirstPagesUseOneSelect(Workflow workflow) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 0);
        resetSqlStatementCounts();

        mockMvc.perform(workflow.request().header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allWorkflows")
    void exhaustedCursorsUseOneSelect(Workflow workflow) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 3);
        var mvc = KeysetTestFixtures.mockMvc(context, 3);
        var firstPage = readPage(mvc, workflow.request());
        assertThat(firstPage.size()).isEqualTo(3);
        resetSqlStatementCounts();

        mvc.perform(nextPageRequest(workflow, firstPage).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    private static Stream<Workflow> allWorkflows() {
        return KeysetTestFixtures.workflows();
    }

    @ParameterizedTest(name = "{0}, SELECTs {1}")
    @MethodSource({"longListCursorPages", "longSearchCursorPages"})
    void populatedPagesWithLongCursorsUseExpectedSelectCount(Workflow workflow, int expectedSelects) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 3);
        KeysetTestFixtures.useLongIdentifiers(entityManager, workflow);
        var mvc = KeysetTestFixtures.mockMvc(context, 2);
        var first = readPage(mvc, workflow.request());
        assertThat(first.size()).isEqualTo(2);
        resetSqlStatementCounts();

        mvc.perform(nextPageRequest(workflow, first).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        assertReadOnlySelectCount(expectedSelects);
    }

    private static Stream<Workflow> longListWorkflows() {
        return KeysetTestFixtures.longIdentifierWorkflows(KeysetTestFixtures.listWorkflows());
    }

    private static Stream<Arguments> longListCursorPages() {
        return longListWorkflows().map(workflow -> Arguments.of(workflow, 1));
    }

    private static Stream<Arguments> longSearchCursorPages() {
        return KeysetTestFixtures.searchWorkflows().map(workflow -> Arguments.of(workflow, 2));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void combinedSearchFiltersUseTwoSelects(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);
        var request = KeysetTestFixtures.filteredSearchRequest(workflow);
        resetSqlStatementCounts();

        mockMvc.perform(request.header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void combinedSearchFilterContinuationUsesTwoSelects(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);
        var first = readPage(mockMvc, KeysetTestFixtures.filteredSearchRequest(workflow));
        assertThat(first.size()).isEqualTo(2);
        var anchor = first.get(1);
        resetSqlStatementCounts();

        mockMvc.perform(KeysetTestFixtures.filteredSearchRequest(workflow).header("x-api-version", "1")
                        .param("attractionId", anchor.path("attractionId").asText())
                        .param("updatedOn", anchor.path("changedOn").asText())
                        .param("regionName", anchor.path("regionName").asText())
                        .param("cityName", anchor.path("cityName").asText("")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void exhaustedFilteredSearchUsesOneSelect(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);
        var mvc = KeysetTestFixtures.mockMvc(context, 3);
        var first = readPage(mvc, KeysetTestFixtures.filteredSearchRequest(workflow));
        assertThat(first.size()).isEqualTo(3);
        var anchor = first.get(2);
        resetSqlStatementCounts();

        mvc.perform(KeysetTestFixtures.filteredSearchRequest(workflow).header("x-api-version", "1")
                        .param("attractionId", anchor.path("attractionId").asText())
                        .param("updatedOn", anchor.path("changedOn").asText())
                        .param("regionName", anchor.path("regionName").asText())
                        .param("cityName", anchor.path("cityName").asText("")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void unmatchedSearchFiltersUseOneSelect(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);
        resetSqlStatementCounts();

        mockMvc.perform(workflow.request().header("x-api-version", "1")
                        .param("mustVisit", "true").param("q", "NeverMatches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    private static Stream<Workflow> searchWorkflows() {
        return KeysetTestFixtures.searchWorkflows();
    }

    @ParameterizedTest
    @CsvSource({"2026-09-15, 5", "2026-10-01, 0"})
    void dateFilteredTripsUseOneSelect(String date, int resultSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.trips(entityManager, 5);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips").header("x-api-version", "1").param("date", date).param("sd", "ASC")
                        .param("tripId", "2147483648").param("updatedOn", KeysetTestFixtures.CHANGED_ON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "ASC"})
    void continentDirectionsUseOneSelect(String direction) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get("/continents").header("x-api-version", "1").param("sd", direction))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));

        assertReadOnlySelectCount(1);
    }

    @Test
    void sqlCounterCountsExecutedSelectsAndRejectsIncorrectExpectations() {
        resetSqlStatementCounts();

        entityManager.createNativeQuery("SELECT 1", Integer.class).getSingleResult();
        entityManager.createNativeQuery("SELECT 2", Integer.class).getSingleResult();

        assertThatThrownBy(() -> assertSelectCount(1)).isInstanceOf(SQLStatementCountMismatchException.class);
        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3})
    void blockedTripDeletionUsesTwoSelects(int attractionCount) throws Exception {
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE trip_id = 1 AND id > :count")
                .setParameter("count", attractionCount).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(delete("/trips/1").header("x-api-version", "1")).andExpect(status().isConflict());

        assertReadOnlySelectCount(2);
    }

    @Test
    void missingTripDeletionUsesOneSelect() throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(delete("/trips/100").header("x-api-version", "1")).andExpect(status().isNotFound());

        assertReadOnlySelectCount(1);
    }

    @Test
    void emptyTripDeletionUsesTwoSelectsAndOneDelete() throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(delete("/trips/3").header("x-api-version", "1")).andExpect(status().isNoContent());

        assertSelectCount(2);
        assertDeleteCount(1);
        assertInsertCount(0);
        assertUpdateCount(0);
    }

    @Test
    void conditionalTripDeletionUsesOneDeleteAndNoSelects() {
        resetSqlStatementCounts();

        var deleted = tripRepo.deleteIfEmpty(1L);

        assertThat(deleted).isFalse();
        assertSelectCount(0);
        assertDeleteCount(1);
        assertInsertCount(0);
        assertUpdateCount(0);
    }

    @ParameterizedTest(name = "{0}, results {1}")
    @CsvSource({
            "/attractions, 2",
            "/attractions?sd=ASC, 2",
            "/attractions?sd=DESC, 2",
            "/attractions?sd=ASC&attractionId=2&updatedOn=2024-08-23T08:12:43, 2",
            "/attractions?sd=DESC&attractionId=4&updatedOn=2025-01-10T23:08:41, 2",
            "/countries, 2",
            "/countries?sd=ASC, 2",
            "/countries?sd=DESC, 2",
            "/countries?sd=ASC&countryId=2&updatedOn=2025-02-01T20:04:59, 2",
            "/countries?sd=DESC&countryId=4&updatedOn=2025-02-02T08:14:00, 2",
            "/regions, 2",
            "/regions?sd=ASC, 2",
            "/regions?sd=DESC, 2",
            "/regions?sd=ASC&regionId=2&updatedOn=2024-10-05T12:32:10, 2",
            "/regions?sd=DESC&regionId=5&updatedOn=2025-02-10T09:23:43, 2",
            "/cities, 2",
            "/cities?sd=ASC, 2",
            "/cities?sd=DESC, 2",
            "/cities?sd=ASC&cityId=2&updatedOn=2024-10-05T12:32:10, 2",
            "/cities?sd=DESC&cityId=5&updatedOn=2025-02-10T09:23:43, 2",
            "/bucket-list/items, 2",
            "/bucket-list/items?sd=ASC, 2",
            "/bucket-list/items?sd=DESC, 2",
            "/bucket-list/items?sd=ASC&itemId=2&updatedOn=2025-12-20T10:00:01, 1",
            "/bucket-list/items?sd=DESC&itemId=2&updatedOn=2025-12-20T10:00:01, 1",
            "/trips, 2",
            "/trips?sd=ASC, 2",
            "/trips?sd=DESC, 2",
            "/continents, 4"
    })
    void listPagesLoadTheirResponsesInOneSelect(String path, int resultSize) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(1);
    }

    @Test
    void attractionDetailsUseOneSelect() throws Exception {
        KeysetTestFixtures.populateAttractionDetails(entityManager);
        resetSqlStatementCounts();

        mockMvc.perform(get("/attractions/5").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNotEmpty());

        assertReadOnlySelectCount(1);
    }

    @Test
    void linkedBucketListItemDetailsUseOneSelect() throws Exception {
        KeysetTestFixtures.linkBucketListItemsToRegionsAndTrips(entityManager);
        resetSqlStatementCounts();

        mockMvc.perform(get("/bucket-list/items/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNotEmpty());

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/cities/1", "/countries/1", "/regions/1"})
    void locationSummaryUsesOneSelect(String path) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNotEmpty());

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void cityMappingUsesOneSelectRegardlessOfResultSize(int resultSize) {
        entityManager.createNativeQuery("UPDATE city SET region_id = id").executeUpdate();
        entityManager.createNativeQuery("UPDATE region SET country_id = id").executeUpdate();
        resetSqlStatementCounts();

        var cities = cityRepo.findAllOrderByOldest(Limit.of(resultSize)).stream().map(GetCityResponse::from).toList();

        assertThat(cities).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void regionMappingUsesOneSelectRegardlessOfResultSize(int resultSize) {
        entityManager.createNativeQuery("UPDATE region SET country_id = id").executeUpdate();
        resetSqlStatementCounts();

        var regions = regionRepo.findAllOrderByOldest(Limit.of(resultSize)).stream().map(GetRegionResponse::from).toList();

        assertThat(regions).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void countryMappingUsesOneSelectRegardlessOfResultSize(int resultSize) {
        resetSqlStatementCounts();

        var countries = countryRepo.findAllOrderByOldest(Limit.of(resultSize)).stream().map(GetCountryResponse::from).toList();

        assertThat(countries).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void attractionMappingUsesOneSelectRegardlessOfResultSize(int resultSize) {
        resetSqlStatementCounts();

        var attractions = attractionRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetAttractionResponse::from).toList();

        assertThat(attractions).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void specificationMappingUsesOneSelectRegardlessOfResultSize(int resultSize) {
        resetSqlStatementCounts();

        var attractions = attractionRepo.findMatchingAttractions(Specification.allOf(), Limit.of(resultSize)).stream()
                .map(GetAttractionResponse::from).toList();

        assertThat(attractions).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}, results {1}")
    @CsvSource({
            "/search/continent/Test continent 0/attractions, 2",
            "/search/country/1/attractions, 2",
            "/search/region/1/attractions, 2",
            "/search/city/1/attractions, 2",
            "/search/attraction/1/attractions, 1"
    })
    void searchUsesTwoSelects(String path, int resultSize) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/search/country/1/attractions", "/search/country/2/attractions"})
    void countrySearchContinuationUsesTwoSelects(String path) throws Exception {
        var mvc = KeysetTestFixtures.mockMvc(context, 1);
        var first = readPage(mvc, locationSearchRequest(path));
        assertThat(first.size()).isEqualTo(1);
        resetSqlStatementCounts();

        mvc.perform(locationCursorRequest(path, first.get(0)).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        assertReadOnlySelectCount(2);
    }

    @Test
    void emptySearchUsesOneSelect() throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get("/search/country/999999/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 3, 5})
    void tripBoardUsesTwoSelectsRegardlessOfResultSize(int resultSize) throws Exception {
        entityManager.createNativeQuery("""
                INSERT INTO trip_attraction(created_on, attraction_id, trip_id, status, attraction_group, board_position, must_visit)
                SELECT created_on, id, 1, 'PLANNED', 'SECONDARY', id, false FROM attraction WHERE id IN (4, 5)
                """).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE trip_id = 1 AND board_position > :resultSize")
                .setParameter("resultSize", resultSize).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(2);
    }

    @Test
    void tripBoardMappingWithOptionalFieldsUsesTwoSelects() {
        KeysetTestFixtures.populateTripBoardDetails(entityManager);
        resetSqlStatementCounts();

        var attractions = tripService.getAttractions(1L).stream().map(GetTripAttractionResponse::from).toList();

        assertThat(attractions).hasSize(3);
        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 20})
    void tripBoardReadWithDistinctOptionalRelationshipsUsesTwoSelects(int resultSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, resultSize);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 29})
    void planReadsBoardAndScheduledEntriesWithThreeSelects(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(entryCount + 1));
        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(entryCount))
                .andExpect(jsonPath("$.unscheduledAttractions.length()").value(1));

        assertReadOnlySelectCount(3);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 45})
    void itineraryReadUsesOneSelectRegardlessOfDayCount(int dayCount) throws Exception {
        var firstDate = LocalDate.of(2028, 2, 1);
        tripService.saveTrip("Another itinerary", firstDate, firstDate);
        var trip = tripService.saveTrip("Itinerary query budget", firstDate, firstDate.plusDays(dayCount - 1));
        entityManager.createNativeQuery("""
                UPDATE itinerary SET time_zone = 'Europe/Belgrade', last_checked_at = '2028-01-30T09:00:00Z'
                WHERE trip_id = :tripId
                """).setParameter("tripId", trip.getId()).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/{id}/itinerary", trip.getId()).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days.length()").value(dayCount));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {3, 30})
    void itineraryReadWithUnscheduledAttractionsUsesOneSelectRegardlessOfBoardSize(int boardSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize);
        entityManager.createNativeQuery("""
                INSERT INTO itinerary(trip_id, time_zone, last_checked_at)
                VALUES (1, 'Europe/Belgrade', '2026-08-31T09:00:00Z');
                INSERT INTO itinerary_day(trip_id, date)
                SELECT id, trip_start_date + day_offset
                FROM trip
                CROSS JOIN LATERAL generate_series(0, trip_end_date - trip_start_date) AS days(day_offset)
                WHERE id = 1;
                """).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeZone").exists())
                .andExpect(jsonPath("$.unscheduledAttractions.length()").value(boardSize));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void entrySummariesUseOneSelectRegardlessOfEntryCount(int entryCount) {
        seedItineraryWithEntries(entryCount);
        resetSqlStatementCounts();

        var entries = itineraryRepo.findEntrySummariesByTripId(1L);

        assertThat(entries).hasSize(entryCount);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void itineraryReadWithEntriesStillUsesOneSelect(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(entryCount))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").exists())
                .andExpect(jsonPath("$.days[1].entries[0].timing.end").exists())
                .andExpect(jsonPath("$.unscheduledAttractions.length()").value(1));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void itineraryReadWithPendingChangeNoticesStillUsesOneSelect(int noticeCount) throws Exception {
        seedItineraryWithEntries(noticeCount);
        entityManager.createNativeQuery("""
                UPDATE itinerary SET last_checked_at = '2026-08-31T09:00:00Z' WHERE trip_id = 1
                """).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changeNotices.length()").value(noticeCount));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void itineraryReadWithPendingTimingChangesUsesOneSelect(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        entityManager.createNativeQuery("""
                UPDATE itinerary SET last_checked_at = '2026-08-31T09:00:00Z' WHERE trip_id = 1;
                UPDATE itinerary_entry SET included_in_last_check = true, planned_length_changed_since_check = true
                WHERE trip_id = 1;
                """).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(entryCount))
                .andExpect(jsonPath("$.changeNotices.length()").value(entryCount));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
             2 | start          | {"startTime":"07:01"}
            30 | start          | {"startTime":"07:01"}
             2 | end            | {"endDate":"2026-09-02","endTime":"07:31"}
            30 | end            | {"endDate":"2026-09-02","endTime":"07:31"}
             2 | planned-length | {"plannedMinutes":31}
            30 | planned-length | {"plannedMinutes":31}
            """)
    void editingTimingAndPropagatingUsesOneSelect(int entryCount, String field, String request) throws Exception {
        seedItineraryWithEntries(entryCount);
        entityManager.createNativeQuery("UPDATE trip_attraction SET visit_time = '30-45m' WHERE id = 1").executeUpdate();
        var firstEntryId = entityManager.createNativeQuery("""
                SELECT id FROM itinerary_entry WHERE trip_id = 1 AND path_position = 1
                """).getSingleResult();
        resetSqlStatementCounts();

        mockMvc.perform(put("/trips/1/itinerary/entries/{entryId}/{field}", firstEntryId, field)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(1);
        assertInsertCount(0);
        assertUpdateCount(entryCount);
        assertDeleteCount(0);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void lockingAStartAndReadingItsChangeNoticeUseOneSelectEach(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        var firstEntryId = entityManager.createNativeQuery("""
                SELECT id FROM itinerary_entry WHERE trip_id = 1 AND path_position = 1
                """).getSingleResult();
        mockMvc.perform(post("/trips/1/itinerary/check").header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        resetSqlStatementCounts();

        mockMvc.perform(put("/trips/1/itinerary/entries/{entryId}/fixed-start", firstEntryId)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fixedStart":true}
                                """))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(1);
        assertInsertCount(0);
        assertUpdateCount(1);
        assertDeleteCount(0);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(entryCount))
                .andExpect(jsonPath("$.changeNotices.length()").value(1));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void rejectingAnAdditionAtAFixedStartUsesTwoSelects(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        entityManager.createNativeQuery("""
                UPDATE itinerary_entry SET fixed_start = true WHERE trip_id = 1 AND path_position = 1
                """).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"attractionId":%d,"date":"2026-09-02","startTime":"07:00"}
                                """.formatted(entryCount + 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").exists());

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 2, 30})
    void recordingACheckUsesTwoUpdatesOneDeleteAndNoSelects(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/check").header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertSelectCount(0);
        assertInsertCount(0);
        assertUpdateCount(2);
        assertDeleteCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void movingAnEntryAndReadingTheOutcomeUseOneSelectEach(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        var firstEntryId = entityManager.createNativeQuery("""
                SELECT id FROM itinerary_entry WHERE trip_id = 1 AND path_position = 1
                """).getSingleResult();
        var destination = new MoveItineraryEntryRequest(LocalDate.parse("2026-09-03"), null, null);
        resetSqlStatementCounts();

        mockMvc.perform(put("/trips/1/itinerary/entries/{entryId}/position", firstEntryId)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(destination)))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(1);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.days[2].entries.length()").value(1));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void removingACheckedEntryAndReadingMultipleRemovalSummariesUseOneSelectEach(int size) throws Exception {
        seedItineraryWithEntries(size);
        mockMvc.perform(post("/trips/1/itinerary/check").header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        entityManager.createNativeQuery("""
                INSERT INTO itinerary_entry_removal (trip_id, date, subject)
                SELECT 1, DATE '2026-09-01', 'Former attraction ' || ordinal
                FROM generate_series(1, :count) AS notices(ordinal);
                """).setParameter("count", size - 1).executeUpdate();
        var firstEntryId = entityManager.createNativeQuery("""
                SELECT id FROM itinerary_entry WHERE trip_id = 1 AND path_position = 1
                """).getSingleResult();
        resetSqlStatementCounts();

        mockMvc.perform(delete("/trips/1/itinerary/entries/{entryId}", firstEntryId)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(1);
        assertInsertCount(1);
        assertUpdateCount(0);
        assertDeleteCount(1);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(size - 1))
                .andExpect(jsonPath("$.changeNotices.length()").value(size));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}, {1} entries")
    @MethodSource("confirmedBoardRemovalWorkflows")
    void previewAndReadAfterConfirmedBoardRemovalUseOneSelectEach(String action, int entryCount,
            MockHttpServletRequestBuilder request, Function<ConfirmItineraryEntryRemovalRequest, Object> body,
            int writeSelects, int writeUpdates, int writeDeletes) throws Exception {
        seedItineraryWithEntries(entryCount);
        mockMvc.perform(post("/trips/1/itinerary/check").header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        resetSqlStatementCounts();

        var preview = mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(entryCount))
                .andExpect(jsonPath("$.unscheduledAttractions.length()").value(1))
                .andReturn().getResponse().getContentAsString();

        assertReadOnlySelectCount(1);
        var entry = mapper.readValue(preview, GetItineraryResponse.class).days().get(1).entries().getFirst();
        var confirmation = new ConfirmItineraryEntryRemovalRequest(entry.entryId());
        resetSqlStatementCounts();

        mockMvc.perform(request.header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body.apply(confirmation))))
                .andExpect(status().isNoContent());

        assertSelectCount(writeSelects);
        assertInsertCount(1);
        assertUpdateCount(writeUpdates);
        assertDeleteCount(writeDeletes);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[1].entries.length()").value(entryCount - 1))
                .andExpect(jsonPath("$.changeNotices.length()").value(1));

        assertReadOnlySelectCount(1);
    }

    private static Stream<Arguments> confirmedBoardRemovalWorkflows() {
        return Stream.of(2, 30).flatMap(size -> Stream.of(
                boardRemovalWorkflow("Remove from trip", size, delete("/trips/1/attractions/1"),
                        confirmation -> confirmation, 1, 1, 2),
                boardRemovalWorkflow("Move to Excluded", size, put("/trips/1/board/attractions/1"),
                        confirmation -> new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, confirmation), 4, 2, 1),
                boardRemovalWorkflow("Set group to Excluded", size, put("/trips/1/attractions/1/group"),
                        confirmation -> new UpdateAttractionGroupRequest(TripAttractionGroupDTO.EXCLUDED, confirmation), 4, 2, 1)));
    }

    private static Arguments boardRemovalWorkflow(String action, int size, MockHttpServletRequestBuilder request,
            Function<ConfirmItineraryEntryRemovalRequest, Object> body, int selects, int updates, int deletes) {
        return Arguments.of(action, size, request, body, selects, updates, deletes);
    }

    @ParameterizedTest
    @CsvSource({"2, false", "30, false", "2, true", "30, true"})
    void itineraryReadWithRepeatedClocksStillUsesOneSelect(int entryCount, boolean secondOccurrence) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, entryCount + 1);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = DATE '2026-10-25', trip_end_date = DATE '2026-10-25' WHERE id = 1;
                INSERT INTO itinerary(trip_id, time_zone) VALUES (1, 'Europe/Belgrade');
                INSERT INTO itinerary_day(trip_id, date) VALUES (1, DATE '2026-10-25');
                INSERT INTO itinerary_entry(trip_id, date, attraction_id, path_position, zone_id,
                    start_time, second_start_occurrence, planned_minutes, fixed_start)
                SELECT 1, DATE '2026-10-25', position, position, 'Europe/Belgrade',
                    TIME '02:30', :secondOccurrence, 30, false
                FROM generate_series(1, :size) AS entries(position);
                """).setParameter("size", entryCount).setParameter("secondOccurrence", secondOccurrence).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].entries.length()").value(entryCount))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").exists())
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").exists())
                .andExpect(jsonPath("$.unscheduledAttractions.length()").value(1));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void schedulingWithMissingInputsUsesTwoSelectsAndDoesNotWrite(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"attractionId":%d,"date":"2026-09-03"}
                                """.formatted(entryCount + 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.schedulingInputs").exists());

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void anAttractionMissingFromTheTripUsesTwoSelectsAndDoesNotWrite(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        var attractionNotOnBoard = entryCount + 2;
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"attractionId":%d,"date":"2026-09-03"}
                                """.formatted(attractionNotOnBoard)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").exists());

        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void tripOverviewWithEntriesStillUsesOneSelect(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasItineraryEntries").exists());

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void appendingAnEntryUsesTwoSelects(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        var intent = """
                {"attractionId":%d,"date":"2026-09-02","startTime":"22:00"}
                """.formatted(entryCount + 1);
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(intent))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(2);
        assertInsertCount(1);
        assertUpdateCount(0);
        assertDeleteCount(0);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void insertingBeforeSavedEntriesUsesTwoBulkUpdatesAndTwoSelects(int entryCount) throws Exception {
        seedItineraryWithEntries(entryCount);
        var intent = """
                {"attractionId":%d,"date":"2026-09-02","startTime":"04:00"}
                """.formatted(entryCount + 1);
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(intent))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(2);
        assertInsertCount(1);
        assertUpdateCount(2);
        assertDeleteCount(0);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void firstEntryWithSourceCorrectionHasABoundedSqlBudget(int boardSize) throws Exception {
        seedSchedulingBoard(boardSize);
        entityManager.createNativeQuery("UPDATE trip_attraction SET visit_time = NULL WHERE id = 1").executeUpdate();
        var intent = """
                {"attractionId":1,"date":"2026-09-02","startTime":"09:00","timeZone":"Europe/Belgrade","visitDuration":"45m"}
                """;
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(intent))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(4);
        assertInsertCount(1);
        assertUpdateCount(2);
        assertDeleteCount(0);
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 30})
    void aRepeatedStartUsesTwoSelects(int boardSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = DATE '2026-10-25', trip_end_date = DATE '2026-10-25' WHERE id = 1;
                UPDATE attraction SET city_id = NULL WHERE id = 2;
                INSERT INTO itinerary(trip_id, time_zone) VALUES (1, 'Europe/Belgrade');
                INSERT INTO itinerary_day(trip_id, date) VALUES (1, DATE '2026-10-25');
                """).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/itinerary/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"attractionId":1,"date":"2026-10-25","startTime":"02:30"}
                                """))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(2);
        assertInsertCount(1);
        assertUpdateCount(0);
        assertDeleteCount(0);
    }

    private void seedItineraryWithEntries(int entryCount) {
        seedSchedulingBoard(entryCount + 1);
        entityManager.createNativeQuery("""
                UPDATE itinerary SET time_zone = 'Europe/Belgrade' WHERE trip_id = 1;
                INSERT INTO itinerary_entry(trip_id, date, attraction_id, path_position, zone_id,
                    start_time, planned_minutes, fixed_start)
                SELECT 1, DATE '2026-09-02', position, position, 'Europe/Belgrade',
                    TIME '07:00' + (position - 1) * INTERVAL '30 minutes', 30, false
                FROM generate_series(1, :size) AS entries(position);
                """).setParameter("size", entryCount).executeUpdate();
    }

    private void seedSchedulingBoard(int boardSize) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize);
        entityManager.createNativeQuery("""
                UPDATE attraction SET city_id = NULL WHERE id = 2;
                INSERT INTO itinerary(trip_id) VALUES (1);
                INSERT INTO itinerary_day(trip_id, date)
                SELECT 1, DATE '2026-09-01' + day_offset FROM generate_series(0, 29) AS days(day_offset);
                """).executeUpdate();
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 20})
    void prepareAdditionUsesFourSelectsRegardlessOfBoardSize(int boardSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize + 1);
        var addedId = boardSize + 1L;
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE attraction_id = :id")
                .setParameter("id", addedId).executeUpdate();
        entityManager.createNativeQuery("SELECT setval('trip_attraction_id_seq', :lastId)")
                .setParameter("lastId", addedId).getSingleResult();
        var request = new AddAttractionUnderTripRequest(addedId, TripAttractionGroupDTO.PRIMARY);
        var json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);
        resetSqlStatementCounts();

        mockMvc.perform(post("/trips/1/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isNoContent());

        assertSelectCount(4);
        assertInsertCount(1);
        assertUpdateCount(1);
        assertDeleteCount(0);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 20})
    void prepareRemovalUsesNoSelectsRegardlessOfBoardSize(int boardSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize);
        resetSqlStatementCounts();

        mockMvc.perform(delete("/trips/1/attractions/1").header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertSelectCount(0);
        assertInsertCount(0);
        assertUpdateCount(1);
        assertDeleteCount(1);
    }

    @ParameterizedTest(name = "{0}, {1} attractions")
    @MethodSource("groupChangesWithoutConfirmation")
    void prepareGroupChangeUsesThreeSelectsRegardlessOfBoardSize(String action, int boardSize,
            MockHttpServletRequestBuilder request, Object body) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize);
        resetSqlStatementCounts();

        mockMvc.perform(request.header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(body)))
                .andExpect(status().isNoContent());

        assertSelectCount(3);
        assertInsertCount(0);
        assertUpdateCount(2);
        assertDeleteCount(0);
    }

    private static Stream<Arguments> groupChangesWithoutConfirmation() {
        return Stream.of(1, 20).flatMap(size -> Stream.of(
                Arguments.of("Move to Secondary", size, put("/trips/1/board/attractions/1"),
                        new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.SECONDARY, null, null)),
                Arguments.of("Set group to Secondary", size, put("/trips/1/attractions/1/group"),
                        new UpdateAttractionGroupRequest(TripAttractionGroupDTO.SECONDARY))));
    }

    @ParameterizedTest
    @ValueSource(ints = {3, 20})
    void prepareMoveBetweenNeighborsUsesSevenSelectsRegardlessOfBoardSize(int boardSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, boardSize);
        entityManager.createNativeQuery("UPDATE attraction SET city_id = 1 WHERE id IN (1, 2, 3)")
                .executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(put("/trips/1/board/attractions/3").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"targetGroup": "PRIMARY", "previousAttractionId": 1, "nextAttractionId": 2}
                                """))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertSelectCount(7);
        assertInsertCount(0);
        assertUpdateCount(1);
        assertDeleteCount(0);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 20})
    void tripMetadataUsesOneSelectRegardlessOfBoardSize(int resultSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, resultSize);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").exists());

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 20})
    void tripDateLookupUsesOneSelectRegardlessOfResultSize(int resultSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, resultSize);
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips").param("date", "2026-09-15").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void bucketListRegionAndTripMappingUsesOneSelect(int resultSize) {
        KeysetTestFixtures.linkBucketListItemsToRegionsAndTrips(entityManager);
        resetSqlStatementCounts();

        var items = bucketListItemRepo.findAllOrderByOldest(BucketListStatusFilter.ALL, Limit.of(resultSize)).stream()
                .map(GetBucketListItemResponse::from).toList();

        assertThat(items).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void bucketListCityAndTripMappingUsesOneSelect(int resultSize) {
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET completed_on = (SELECT trip_end_date FROM trip WHERE trip.id = bucket_list_item.id),
                    would_repeat = false, city_id = id, trip_id = id
                """).executeUpdate();
        resetSqlStatementCounts();

        var items = bucketListItemRepo.findAllOrderByOldest(BucketListStatusFilter.ALL, Limit.of(resultSize)).stream()
                .map(GetBucketListItemResponse::from).toList();

        assertThat(items).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @Test
    void bucketListMappingWithMixedOptionalRelationshipsUsesOneSelect() {
        KeysetTestFixtures.populateBucketListDetails(entityManager);
        resetSqlStatementCounts();

        var items = bucketListItemRepo.findAllOrderByOldest(BucketListStatusFilter.ALL, Limit.of(3)).stream()
                .map(GetBucketListItemResponse::from).toList();

        assertThat(items).hasSize(3);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @CsvSource({
            "/bucket-list/items?sd=ASC, 2",
            "/bucket-list/items?sd=DESC, 2",
            "/bucket-list/items?sd=ASC&itemId=2&updatedOn=2025-12-20T10:00:01, 1",
            "/bucket-list/items?sd=DESC&itemId=2&updatedOn=2025-12-20T10:00:01, 1"
    })
    void linkedBucketListPagesUseOneSelect(String path, int resultSize) throws Exception {
        KeysetTestFixtures.linkBucketListItemsToRegionsAndTrips(entityManager);
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @CsvSource({
            "/bucket-list/items?status=ALL, 2",
            "/bucket-list/items?status=TODO, 1",
            "/bucket-list/items?status=COMPLETED, 2",
            "/bucket-list/items?status=COMPLETED&sd=ASC&itemId=1&updatedOn=2025-12-20T10:00:00, 1"
    })
    void filteredBucketListPagesUseOneSelect(String path, int resultSize) throws Exception {
        KeysetTestFixtures.prepareMixedBucketListItems(entityManager);
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{2} {3}, generated {0}, page size {1}")
    @CsvSource({
            "6, 1, TODO, ASC", "6, 1, TODO, DESC",
            "6, 1, COMPLETED, ASC", "6, 1, COMPLETED, DESC",
            "44, 20, TODO, ASC", "44, 20, TODO, DESC",
            "44, 20, COMPLETED, ASC", "44, 20, COMPLETED, DESC"
    })
    void initialFilteredBucketListContentAndCountersUseTwoSelects(
            int generatedSize, int pageSize, BucketListStatusFilter filter, String direction) throws Exception {
        KeysetTestFixtures.insertMixedBucketListDataset(entityManager, generatedSize);
        var mvc = KeysetTestFixtures.mockMvc(context, pageSize);
        resetSqlStatementCounts();

        mvc.perform(get("/bucket-list/items")
                        .param("status", filter.name()).param("sd", direction)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pageSize));
        mvc.perform(get("/bucket-list/items/counts").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all").isNumber());

        assertReadOnlySelectCount(2);
    }

    @Test
    void bucketListCountersUseOneAggregateSelect() throws Exception {
        KeysetTestFixtures.prepareMixedBucketListItems(entityManager);
        resetSqlStatementCounts();

        mockMvc.perform(get("/bucket-list/items/counts").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all").isNumber());

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest(name = "{0}, page size {1}, results {2}")
    @CsvSource({
            "ALL, 1, 1", "ALL, 2, 2", "ALL, 20, 20", "ALL, 100, 43",
            "TODO, 1, 1", "TODO, 2, 2", "TODO, 20, 20", "TODO, 100, 23",
            "COMPLETED, 1, 1", "COMPLETED, 2, 2", "COMPLETED, 20, 20", "COMPLETED, 100, 20"
    })
    void largeFilteredBucketListMappingUsesOneSelect(BucketListStatusFilter filter, int pageSize, int resultSize) {
        KeysetTestFixtures.insertMixedBucketListDataset(entityManager, 40);
        resetSqlStatementCounts();

        var items = bucketListItemRepo.findAllOrderByOldest(filter, Limit.of(pageSize)).stream()
                .map(GetBucketListItemResponse::from).toList();

        assertThat(items).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @Test
    void largeBucketListCountersUseOneAggregateSelect() throws Exception {
        KeysetTestFixtures.insertMixedBucketListDataset(entityManager, 40);
        resetSqlStatementCounts();

        mockMvc.perform(get("/bucket-list/items/counts").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all").isNumber());

        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @CsvSource({
            "COUNTRY, 3",
            "CONTINENT, 3",
            "REGION, 3",
            "CITY, 3",
            "ATTRACTION, 3",
            "MAIN_ATTRACTION, 1",
            "INFORMATION_PROVIDER, 3"
    })
    void suggestionsUseOneSelect(SearchInElement searchIn, int resultSize) {
        resetSqlStatementCounts();

        var suggestions = searchService.suggestNames("test", searchIn, null);

        assertThat(suggestions).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @Test
    void countryVisitSummariesUseTwoSelects() {
        resetSqlStatementCounts();

        var summaries = tripService.getCountryVisitSummaries();

        assertThat(summaries).hasSize(3);
        assertReadOnlySelectCount(2);
    }

    @Test
    void visitHistoryUsesOneSelect() {
        resetSqlStatementCounts();

        var visits = tripService.getVisitHistory(1L, List.of(1L, 2L, 3L));

        assertThat(visits).hasSize(1);
        assertReadOnlySelectCount(1);
    }

    private static void assertReadOnlySelectCount(int expectedCount) {
        assertSelectCount(expectedCount);
        assertInsertCount(0);
        assertUpdateCount(0);
        assertDeleteCount(0);
    }
}
