package com.triptrove.manager;

import com.fasterxml.jackson.databind.JsonNode;
import com.triptrove.manager.KeysetTestFixtures.Workflow;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static com.triptrove.manager.KeysetTestFixtures.filteredSearchRequest;
import static com.triptrove.manager.KeysetTestFixtures.nextPageRequest;
import static com.triptrove.manager.KeysetTestFixtures.readPage;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@Transactional
@AutoConfigureMockMvc
@Sql("/db/attractions-test-data.sql")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PaginationTest extends AbstractIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @ParameterizedTest(name = "{0}")
    @MethodSource("standardBindingScenarios")
    void omittedOrBlankPaginationReturnsTheDescendingFirstPage(Workflow workflow) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 3);

        var page = readPage(mockMvc, workflow.request());

        assertThat(page.valueStream().map(item -> item.path(workflow.responseField()).longValue()).toList())
                .containsExactly(3L, 2L);
    }

    private static Stream<Workflow> standardBindingScenarios() {
        var defaults = defaultDirectionWorkflows()
                .map(workflow -> workflow.withParameters(Map.of()));
        var blankCursors = defaultDirectionWorkflows()
                .filter(workflow -> List.of("/countries", "/attractions", "/search/country/1/attractions")
                        .contains(workflow.path()))
                .flatMap(workflow -> Stream.of("", "   ").map(value ->
                        workflow.withParameters(Map.of(workflow.cursorField(), value, "updatedOn", value))));
        var blankDirections = defaultDirectionWorkflows()
                .filter(workflow -> List.of("/countries", "/attractions").contains(workflow.path()))
                .flatMap(workflow -> Stream.of("", "   ")
                        .map(direction -> workflow.withParameters(Map.of("sd", direction))));
        return Stream.of(defaults, blankCursors, blankDirections).flatMap(stream -> stream);
    }

    private static Stream<Workflow> defaultDirectionWorkflows() {
        return KeysetTestFixtures.workflows().filter(workflow ->
                workflow.parameters().isEmpty() || workflow.parameters().equals(Map.of("sd", "DESC")));
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({"ASC, 3;5;2;1;4", "DESC, 4;1;2;5;3"})
    void tripsFollowCreationTimeRatherThanIdentifierOrder(String direction, String expectedIdentifiers) throws Exception {
        prepareTripCreationOrder();
        var expected = Arrays.stream(expectedIdentifiers.split(";")).map(Long::valueOf).toList();
        var creationTimes = Map.of(
                3L, "2026-09-28T12:00:01.000001", 5L, "2026-09-28T12:00:02.000002",
                2L, "2026-09-28T12:00:03.000003", 1L, "2026-09-28T12:00:04.000004",
                4L, "2026-09-28T12:00:05.000005");

        var pages = readPages(mockMvc, () -> get("/trips").param("sd", direction),
                "tripId", "tripId", 2, 5);

        assertTraversal(pages, "tripId", 2, expected);
        pages.stream().flatMap(JsonNode::valueStream).forEach(trip ->
                assertThat(trip.get("changedOn").asText())
                        .isEqualTo(creationTimes.get(trip.get("tripId").longValue())));
    }

    private void prepareTripCreationOrder() {
        entityManager.createNativeQuery("""
                UPDATE trip SET created_on = fixture.created_on, updated_on = null
                FROM (VALUES
                    (3, TIMESTAMP '2026-09-28 12:00:01.000001'),
                    (5, TIMESTAMP '2026-09-28 12:00:02.000002'),
                    (2, TIMESTAMP '2026-09-28 12:00:03.000003'),
                    (1, TIMESTAMP '2026-09-28 12:00:04.000004'),
                    (4, TIMESTAMP '2026-09-28 12:00:05.000005')
                ) AS fixture(id, created_on) WHERE trip.id = fixture.id
                """).executeUpdate();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/search/continent/Test continent 0/attractions",
            "/search/country/1/attractions",
            "/search/region/1/attractions",
            "/search/city/1/attractions",
            "/search/attraction/1000000/attractions"
    })
    void searchReturnsEveryMatchWhenAnEditedAttractionCrossesAPageBoundary(String path) throws Exception {
        entityManager.createNativeQuery("""
                INSERT INTO attraction(id, name, country_id, region_id, created_on, category, type,
                    is_countrywide, is_traditional, must_visit, information_provider_id, source_date)
                VALUES (1000000, 'Search fixture parent', 1, 1, TIMESTAMP '2026-09-01 00:00:00',
                    'HISTORIC_SITE', 'STABLE', false, false, false, 1, DATE '2026-09-01')
                """).executeUpdate();
        prepareSearchOrdering();
        entityManager.createNativeQuery("""
                UPDATE attraction SET main_attraction_id = 1000000 WHERE id IN (1, 2, 3, 4, 5)
                """).executeUpdate();

        var pages = readPages(mockMvc, () -> get(path).param("mustVisit", "true"),
                "attractionId", "attractionId", 2, 5);

        assertTraversal(pages, "attractionId", 2, List.of(3L, 1L, 2L, 4L, 5L));
        assertThat(pages.getFirst().get(0).get("changedOn").asText()).isEqualTo("2026-09-28T12:00:06.000006");
        pages.stream().flatMap(JsonNode::valueStream).forEach(attraction ->
                assertThat(attraction.get("visitStatus").asText()).isNotBlank());
    }

    private void prepareSearchOrdering() {
        entityManager.createNativeQuery("""
                UPDATE attraction
                SET name = 'Search fixture ' || attraction.id, country_id = 1, region_id = 1,
                    city_id = 1, main_attraction_id = null, must_visit = true,
                    created_on = fixture.created_on, updated_on = fixture.updated_on
                FROM (VALUES
                    (1, TIMESTAMP '2026-09-28 12:00:05.000005', null),
                    (2, TIMESTAMP '2026-09-28 12:00:03.000003', null),
                    (3, TIMESTAMP '2026-09-28 12:00:04.000004', TIMESTAMP '2026-09-28 12:00:06.000006'),
                    (4, TIMESTAMP '2026-09-28 12:00:02.000002', null),
                    (5, TIMESTAMP '2026-09-28 12:00:01.000001', null)
                ) AS fixture(id, created_on, updated_on) WHERE attraction.id = fixture.id
                """).executeUpdate();
    }

    @Test
    void mainAttractionSearchReturnsAllFourChildren() throws Exception {
        prepareSearchOrdering();
        entityManager.createNativeQuery("""
                UPDATE attraction SET main_attraction_id = 1 WHERE id IN (2, 3, 4, 5)
                """).executeUpdate();

        var pages = readPages(mockMvc, () -> get("/search/attraction/1/attractions"),
                "attractionId", "attractionId", 2, 4);

        assertTraversal(pages, "attractionId", 2, List.of(3L, 2L, 4L, 5L));
    }

    @ParameterizedTest
    @CsvSource({"ASC, 3, 2;1;4;3", "DESC, 2, 5;3"})
    void changingATripBetweenRequestsUsesLiveCursorOrdering(
            String direction, long movingIdentifier, String remainingIdentifiers) throws Exception {
        prepareTripCreationOrder();
        var firstPage = readPage(mockMvc, get("/trips").param("sd", direction));
        var anchor = firstPage.get(1);
        entityManager.createNativeQuery("""
                UPDATE trip SET updated_on = TIMESTAMP '2026-09-28 12:00:06.000006' WHERE id = :identifier
                """).setParameter("identifier", movingIdentifier).executeUpdate();
        entityManager.clear();
        var expected = Arrays.stream(remainingIdentifiers.split(";")).map(Long::valueOf).toList();
        var pages = new ArrayList<JsonNode>();
        var request = get("/trips").param("sd", direction)
                .param("tripId", anchor.get("tripId").asText())
                .param("updatedOn", anchor.get("changedOn").asText());

        for (int pageNumber = 0; pageNumber < Math.ceilDiv(expected.size(), 2); pageNumber++) {
            var page = readPage(mockMvc, request);
            assertThat(page.size()).isPositive();
            pages.add(page);
            var last = page.get(page.size() - 1);
            request = get("/trips").param("sd", direction)
                    .param("tripId", last.get("tripId").asText())
                    .param("updatedOn", last.get("changedOn").asText());
        }
        pages.add(readPage(mockMvc, request));

        assertTraversal(pages, "tripId", 2, expected);
        var refreshOrder = Map.of("ASC", List.of(5L, 2L, 1L, 4L, 3L), "DESC", List.of(2L, 4L, 1L, 5L, 3L));
        var refreshed = readPages(mockMvc, () -> get("/trips").param("sd", direction),
                "tripId", "tripId", 2, 5);
        assertTraversal(refreshed, "tripId", 2, refreshOrder.get(direction));
    }

    @ParameterizedTest(name = "{0}, page size {1}, matches {2}")
    @MethodSource("pageBoundaries")
    void paginationReturnsEveryMatchingItemExactlyOnce(Workflow workflow, int pageSize, int matchingSize) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, matchingSize);

        var pages = readPages(KeysetTestFixtures.mockMvc(context, pageSize), workflow::request,
                workflow.cursorField(), workflow.responseField(), pageSize, matchingSize);

        assertTraversal(pages, workflow.responseField(), pageSize, workflow.identifiers().apply(matchingSize));
        pages.stream().flatMap(JsonNode::valueStream).forEach(item ->
                assertThat(item.path("changedOn").asText()).isEqualTo(KeysetTestFixtures.CHANGED_ON));
    }

    private static Stream<Arguments> pageBoundaries() {
        return KeysetTestFixtures.workflows().flatMap(workflow -> Stream.of(
                Arguments.of(workflow, 1, 2),
                Arguments.of(workflow, 2, 1),
                Arguments.of(workflow, 20, 20),
                Arguments.of(workflow, 100, 101)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allWorkflows")
    void paginationOrdersByEffectiveTimeBeforeIdentifier(Workflow workflow) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 5);
        entityManager.createNativeQuery("""
                UPDATE %s SET created_on = fixture.created_on, updated_on = fixture.updated_on
                FROM (VALUES
                    (1, TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-28 12:00:03.123456'),
                    (2, TIMESTAMP '2026-09-28 12:00:02.123456', null),
                    (3, TIMESTAMP '2026-09-02 00:00:00', TIMESTAMP '2026-09-28 12:00:02.123456'),
                    (4, TIMESTAMP '2026-09-28 12:00:01.123456', null),
                    (5, TIMESTAMP '2026-09-03 00:00:00', TIMESTAMP '2026-09-28 12:00:02.123456'),
                    (6, TIMESTAMP '2026-09-28 12:00:02.123456', null),
                    (7, TIMESTAMP '2026-09-28 12:00:01.123456', null),
                    (8, TIMESTAMP '2026-09-04 00:00:00', TIMESTAMP '2026-09-28 12:00:03.123456'),
                    (9, TIMESTAMP '2026-09-28 12:00:02.123456', null),
                    (10, TIMESTAMP '2026-09-05 00:00:00', TIMESTAMP '2026-09-28 12:00:02.123456')
                ) AS fixture(id, created_on, updated_on) WHERE %s.id = fixture.id
                """.formatted(workflow.table(), workflow.table())).executeUpdate();
        var ascending = Map.of(
                "ALL", List.of(4L, 2L, 3L, 5L, 1L),
                "TODO", List.of(7L, 3L, 5L, 9L, 1L),
                "COMPLETED", List.of(4L, 2L, 6L, 10L, 8L));
        var descending = Map.of(
                "ALL", List.of(1L, 5L, 3L, 2L, 4L),
                "TODO", List.of(1L, 9L, 5L, 3L, 7L),
                "COMPLETED", List.of(8L, 10L, 6L, 2L, 4L));
        var expected = Map.of("ASC", ascending, "DESC", descending)
                .get(workflow.parameters().getOrDefault("sd", "DESC"))
                .get(workflow.parameters().getOrDefault("status", "ALL"));
        var changedOn = Map.of(
                1L, "2026-09-28T12:00:03.123456", 2L, "2026-09-28T12:00:02.123456",
                3L, "2026-09-28T12:00:02.123456", 4L, "2026-09-28T12:00:01.123456",
                5L, "2026-09-28T12:00:02.123456", 6L, "2026-09-28T12:00:02.123456",
                7L, "2026-09-28T12:00:01.123456", 8L, "2026-09-28T12:00:03.123456",
                9L, "2026-09-28T12:00:02.123456", 10L, "2026-09-28T12:00:02.123456");

        var pages = readPages(mockMvc, workflow::request, workflow.cursorField(), workflow.responseField(), 2, 5);

        assertTraversal(pages, workflow.responseField(), 2, expected);
        pages.stream().flatMap(JsonNode::valueStream).forEach(item ->
                assertThat(item.path("changedOn").asText())
                        .isEqualTo(changedOn.get(item.path(workflow.responseField()).longValue())));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("allWorkflows")
    void deletingTheCursorAnchorPreservesContinuationAndRetries(Workflow workflow) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 5);
        var pages = new ArrayList<JsonNode>();
        pages.add(readPage(mockMvc, workflow.request()));
        var anchor = pages.getFirst().get(1).path(workflow.responseField()).longValue();
        KeysetTestFixtures.deleteAnchor(entityManager, workflow, anchor);

        pages.add(readPage(mockMvc, nextPageRequest(workflow, pages.getLast())));
        pages.add(readPage(mockMvc, nextPageRequest(workflow, pages.getLast())));
        var replay = readPage(mockMvc, nextPageRequest(workflow, pages.getFirst()));
        pages.add(readPage(mockMvc, nextPageRequest(workflow, pages.getLast())));

        assertThat(replay).isEqualTo(pages.get(1));
        assertTraversal(pages, workflow.responseField(), 2, workflow.identifiers().apply(5));
    }

    private static Stream<Workflow> allWorkflows() {
        return KeysetTestFixtures.workflows();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("longIdentifierWorkflows")
    void identifiersRoundTripAcrossTheSigned32BitBoundary(Workflow workflow) throws Exception {
        KeysetTestFixtures.clear(entityManager);
        workflow.fixture().accept(entityManager, 3);
        KeysetTestFixtures.useLongIdentifiers(entityManager, workflow);
        var wideIdentifiers = Map.of(1L, 2147483647L, 2L, 2147483648L, 3L, 2147483649L);
        var expected = workflow.identifiers().apply(3).stream().map(wideIdentifiers::get).toList();

        var pages = readPages(KeysetTestFixtures.mockMvc(context, 1), workflow::request,
                workflow.cursorField(), workflow.responseField(), 1, 3);

        assertTraversal(pages, workflow.responseField(), 1, expected);
    }

    private static Stream<Workflow> longIdentifierWorkflows() {
        return KeysetTestFixtures.longIdentifierWorkflows(KeysetTestFixtures.workflows());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void searchAppliesCombinedFiltersBeforePaginationAndReturnsVisitStatuses(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);

        var pages = readPages(mockMvc, () -> filteredSearchRequest(workflow),
                "attractionId", "attractionId", 2, 3);

        assertTraversal(pages, "attractionId", 2, List.of(5L, 3L, 1L));
        var statuses = Map.of(1L, "NOT_VISITED", 3L, "VISITED_WANT_RETURN", 5L, "VISITED_DONE");
        pages.stream().flatMap(JsonNode::valueStream).forEach(item ->
                assertThat(item.path("visitStatus").asText()).isEqualTo(statuses.get(item.path("attractionId").longValue())));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchWorkflows")
    void searchReturnsAnEmptyPageWhenNoAttractionMatchesTheFilters(Workflow workflow) throws Exception {
        KeysetTestFixtures.prepareFilteredSearch(entityManager, workflow);

        var page = readPage(mockMvc, workflow.request().param("mustVisit", "true").param("q", "NeverMatches"));

        assertThat(page.isArray()).isTrue();
        assertThat(page.size()).isZero();
    }

    private static Stream<Workflow> searchWorkflows() {
        return KeysetTestFixtures.searchWorkflows();
    }

    @Test
    void dateLookupReturnsAllMatchingTripsInCreationOrderAndIgnoresTheCursor() throws Exception {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.trips(entityManager, 5);
        entityManager.createNativeQuery("""
                UPDATE trip SET created_on = TIMESTAMP '2026-09-01 00:00:00' + id * INTERVAL '1 day',
                    updated_on = TIMESTAMP '2026-09-28 00:00:00' - id * INTERVAL '1 day'
                """).executeUpdate();

        var page = readPage(mockMvc, get("/trips").param("date", "2026-09-15").param("sd", "ASC")
                .param("tripId", "2147483648").param("updatedOn", KeysetTestFixtures.CHANGED_ON));

        assertThat(page.valueStream().map(item -> item.path("tripId").longValue()).toList())
                .containsExactly(5L, 4L, 3L, 2L, 1L);
        assertThat(readPage(mockMvc, get("/trips").param("date", "2026-10-01")).size()).isZero();
    }

    @Test
    void continentsUseAscendingOrderWhenDirectionIsOmittedOrBlank() throws Exception {
        var defaultPage = readPage(mockMvc, get("/continents"));
        var ascendingPage = readPage(mockMvc, get("/continents").param("sd", "ASC"));
        var blankDirectionPage = readPage(mockMvc, get("/continents").param("sd", ""));

        assertThat(defaultPage).isEqualTo(ascendingPage).isEqualTo(blankDirectionPage);
    }

    private static List<JsonNode> readPages(
            MockMvc mockMvc, Supplier<MockHttpServletRequestBuilder> requests,
            String cursorField, String responseField, int pageSize, int matchingSize) throws Exception {
        var pages = new ArrayList<JsonNode>();
        var request = requests.get();
        for (int pageNumber = 0; pageNumber < Math.ceilDiv(matchingSize, pageSize); pageNumber++) {
            var page = readPage(mockMvc, request);
            assertThat(page.isArray()).isTrue();
            assertThat(page.size()).isEqualTo(Math.min(pageSize, matchingSize - pageNumber * pageSize));
            pages.add(page);
            var anchor = page.get(page.size() - 1);
            request = requests.get()
                    .param(cursorField, anchor.get(responseField).asText())
                    .param("updatedOn", anchor.get("changedOn").asText());
        }
        pages.add(readPage(mockMvc, request));
        return pages;
    }

    private static void assertTraversal(
            List<JsonNode> pages, String identifierField, int pageSize, List<Long> expectedIdentifiers) {
        assertThat(pages.getLast().isArray()).isTrue();
        assertThat(pages.getLast().size()).isZero();
        assertThat(pages.subList(0, pages.size() - 1)).allSatisfy(page ->
                assertThat(page.size()).isPositive().isLessThanOrEqualTo(pageSize));
        var identifiers = pages.stream().flatMap(JsonNode::valueStream)
                .map(item -> item.get(identifierField).longValue()).toList();
        assertThat(identifiers).containsExactlyElementsOf(expectedIdentifiers).doesNotHaveDuplicates();
    }
}
