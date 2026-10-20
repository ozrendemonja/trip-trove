package com.triptrove.manager;

import com.triptrove.manager.KeysetTestFixtures.CursorRoute;
import com.triptrove.manager.KeysetTestFixtures.Workflow;
import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.domain.model.BucketListStatusFilter;
import com.triptrove.manager.domain.model.SearchInElement;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.domain.service.SearchService;
import com.triptrove.manager.domain.service.TripService;
import io.hypersistence.utils.jdbc.validator.SQLStatementCountMismatchException;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.triptrove.manager.KeysetTestFixtures.nextPageRequest;
import static com.triptrove.manager.KeysetTestFixtures.readPage;
import static io.hypersistence.utils.jdbc.validator.SQLStatementCountValidator.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                        .param(route.idField(), identifier).param("updatedOn", "1900-01-01T00:00:00.123456"))
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
        resetSqlStatementCounts();

        mockMvc.perform(workflow.request().header("x-api-version", "1")
                        .param(workflow.cursorField(), "2147483648").param("updatedOn", KeysetTestFixtures.CHANGED_ON))
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

    @ParameterizedTest(name = "{0}, cursor {1}, results {2}")
    @MethodSource("filteredSearchPages")
    void combinedSearchFiltersUseTwoSelects(Workflow workflow, Map<String, String> cursor, int resultSize) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);
        var request = KeysetTestFixtures.filteredSearchRequest(workflow);
        cursor.forEach((name, value) -> request.param(name, value));
        resetSqlStatementCounts();

        mockMvc.perform(request.header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(2);
    }

    private static Stream<Arguments> filteredSearchPages() {
        return KeysetTestFixtures.searchWorkflows().flatMap(workflow -> Stream.of(
                Arguments.of(workflow, Map.of(), 2),
                Arguments.of(workflow, Map.of("attractionId", "3", "updatedOn", KeysetTestFixtures.CHANGED_ON), 1)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void exhaustedFilteredSearchUsesOneSelect(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);
        resetSqlStatementCounts();

        mockMvc.perform(KeysetTestFixtures.filteredSearchRequest(workflow).header("x-api-version", "1")
                        .param("attractionId", "1").param("updatedOn", KeysetTestFixtures.CHANGED_ON))
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
            "/search/attraction/1/attractions, 1",
            "/search/country/1/attractions?attractionId=5&updatedOn=2025-02-23T08:12:43, 1",
            "/search/country/2/attractions?attractionId=3&updatedOn=2024-09-14T10:10:47, 1"
    })
    void searchUsesTwoSelects(String path, int resultSize) throws Exception {
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

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
