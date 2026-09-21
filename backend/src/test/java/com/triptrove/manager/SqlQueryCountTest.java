package com.triptrove.manager;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.domain.service.SearchService;
import com.triptrove.manager.domain.service.TripService;
import io.hypersistence.utils.jdbc.validator.SQLStatementCountMismatchException;
import jakarta.transaction.Transactional;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Comparator;
import java.util.List;

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
class SqlQueryCountTest extends AbstractIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

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
    private TripAttractionRepo tripAttractionRepo;

    @Autowired
    private TripRepo tripRepo;

    @Autowired
    private SearchService searchService;

    @Autowired
    private TripService tripService;

    @BeforeEach
    void startQueryMeasurement() {
        resetSqlStatementCounts();
    }

    @Test
    void sqlCounterShouldCountExecutedSelectsAndRejectIncorrectExpectations() {
        entityManager.createNativeQuery("SELECT 1", Integer.class).getSingleResult();
        entityManager.createNativeQuery("SELECT 2", Integer.class).getSingleResult();

        assertThatThrownBy(() -> assertSelectCount(1))
                .isInstanceOf(SQLStatementCountMismatchException.class);
        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3})
    void tripDeletionChecksDependenciesWithoutLoadingAttractions(int resultSize) throws Exception {
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE trip_id = 1 AND id > :resultSize")
                .setParameter("resultSize", resultSize)
                .executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(delete("/trips/1").header("x-api-version", "1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage").value("This item cannot be deleted because other items depend on it."));

        assertReadOnlyProjectionSelectCount(2);
    }

    @Test
    void missingTripDeletionUsesOnlyOneExistenceQuery() throws Exception {
        mockMvc.perform(delete("/trips/100").header("x-api-version", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.errorMessage").value("The requested resource '100' could not be found. Please refresh and try again."));

        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void emptyTripDeletionDoesNotLoadEntitiesOrCollections() throws Exception {
        mockMvc.perform(delete("/trips/3").header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertSelectCount(2);
        assertDeleteCount(1);
        assertInsertCount(0);
        assertUpdateCount(0);
        assertNoManagedEntities();
        assertThat(tripRepo.existsById(3L)).isFalse();
    }

    @Test
    void conditionalTripDeletionCannotDeleteAttractions() {
        assertThat(tripRepo.deleteIfEmpty(1L)).isFalse();

        assertSelectCount(0);
        assertDeleteCount(1);
        assertInsertCount(0);
        assertUpdateCount(0);
        assertNoManagedEntities();
        assertThat(tripRepo.existsById(1L)).isTrue();
        assertThat(tripAttractionRepo.existsByTripId(1L)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({
            "/attractions?sd=ASC, 2",
            "/attractions?sd=DESC, 2",
            "/attractions?sd=ASC&attractionId=2&updatedOn=2024-08-23T08:12:43, 2",
            "/attractions?sd=DESC&attractionId=4&updatedOn=2025-01-10T23:08:41, 2",
            "/countries?sd=ASC, 2",
            "/countries?sd=DESC, 2",
            "/countries?sd=ASC&countryId=2&updatedOn=2025-02-01T20:04:59, 2",
            "/countries?sd=DESC&countryId=4&updatedOn=2025-02-02T08:14:00, 2",
            "/regions?sd=ASC, 2",
            "/regions?sd=DESC, 2",
            "/regions?sd=ASC&regionId=2&updatedOn=2024-10-05T12:32:10, 2",
            "/regions?sd=DESC&regionId=5&updatedOn=2025-02-10T09:23:43, 2",
            "/cities?sd=ASC, 2",
            "/cities?sd=DESC, 2",
            "/cities?sd=ASC&cityId=2&updatedOn=2024-10-05T12:32:10, 2",
            "/cities?sd=DESC&cityId=5&updatedOn=2025-02-10T09:23:43, 2",
            "/bucket-list/items?sd=ASC, 2",
            "/bucket-list/items?sd=DESC, 2",
            "/bucket-list/items?sd=ASC&itemId=2&updatedOn=2025-12-20T10:00:01, 1",
            "/bucket-list/items?sd=DESC&itemId=2&updatedOn=2025-12-20T10:00:01, 1",
            "/trips?sd=ASC, 2",
            "/trips?sd=DESC, 2",
            "/continents, 4"
    })
    void listPagesLoadTheirResponsesInOneSelect(String path, int resultSize) throws Exception {
        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(1);
    }

    @Test
    void attractionDetailsEndpointLoadsItsResponseInOneSelect() throws Exception {
        entityManager.createNativeQuery("""
                UPDATE attraction
                SET city_id = 1, address = 'Full details address', latitude = 10, longitude = 20,
                    tip = 'Full details tip', visit_period_from = '2026-04-01', visit_period_to = '2026-10-01'
                WHERE id = 5
                """).executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/attractions/5").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attractionId").value(5))
                .andExpect(jsonPath("$.cityName").value("Test city 0"))
                .andExpect(jsonPath("$.mainAttractionName").value("Test attraction 0"))
                .andExpect(jsonPath("$.attractionAddress").value("Full details address"));

        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void bucketListItemDetailsEndpointLoadsItsResponseInOneSelect() throws Exception {
        linkBucketListItemsToRegionsAndTrips();
        resetSqlStatementCounts();

        mockMvc.perform(get("/bucket-list/items/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.regionName").value("Test region 0"))
                .andExpect(jsonPath("$.tripName").value("Test trip name 1"));

        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void citySummaryEndpointLoadsItsResponseInOneSelect() throws Exception {
        mockMvc.perform(get("/cities/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cityId").value(1))
                .andExpect(jsonPath("$.regionName").value("Test region 0"))
                .andExpect(jsonPath("$.countryName").value("Test country 0"));

        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void countrySummaryEndpointLoadsItsResponseInOneSelect() throws Exception {
        mockMvc.perform(get("/countries/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countryId").value(1))
                .andExpect(jsonPath("$.continentName").value("Test continent 0"))
                .andExpect(jsonPath("$.isoCode").value("aa"));

        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void regionSummaryEndpointLoadsItsResponseInOneSelect() throws Exception {
        mockMvc.perform(get("/regions/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regionId").value(1))
                .andExpect(jsonPath("$.regionName").value("Test region 0"))
                .andExpect(jsonPath("$.countryName").value("Test country 0"));

        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void cityQueryCountDoesNotGrowWithResults(int resultSize) {
        entityManager.createNativeQuery("UPDATE city SET region_id = id").executeUpdate();
        entityManager.createNativeQuery("UPDATE region SET country_id = id").executeUpdate();
        resetSqlStatementCounts();

        var cities = cityRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetCityResponse::from)
                .toList();

        assertThat(cities).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void regionQueryCountDoesNotGrowWithResults(int resultSize) {
        entityManager.createNativeQuery("UPDATE region SET country_id = id").executeUpdate();
        resetSqlStatementCounts();

        var regions = regionRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetRegionResponse::from)
                .toList();

        assertThat(regions).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void countryQueryCountDoesNotGrowWithResults(int resultSize) {
        var countries = countryRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetCountryResponse::from)
                .toList();

        assertThat(countries).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void attractionQueryCountDoesNotGrowWithResults(int resultSize) {
        var attractions = attractionRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetAttractionResponse::from)
                .toList();

        assertThat(attractions).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void attractionListProjectionPreservesAllResponseFieldsAndOptionalRelationships() {
        var expected = attractionRepo.findAll().stream()
                .sorted(Comparator.comparing(Attraction::getId))
                .map(SqlQueryCountTest::toAttractionDetails)
                .map(GetAttractionResponse::from)
                .toList();
        resetSqlStatementCounts();

        var actual = attractionRepo.findAllOrderByOldest(Limit.of(5)).stream()
                .map(GetAttractionResponse::from)
                .toList();

        assertThat(actual).containsExactlyElementsOf(expected);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void specificationQueryCountDoesNotGrowWithResults(int resultSize) {
        var attractions = attractionRepo.findMatchingAttractions(Specification.allOf(), Limit.of(resultSize)).stream()
                .map(GetAttractionResponse::from)
                .toList();

        assertThat(attractions).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void attractionSearchProjectionPreservesAllResponseFieldsAndOptionalRelationships() {
        var expected = attractionRepo.findAll().stream()
                .map(SqlQueryCountTest::toAttractionDetails)
                .map(GetAttractionResponse::from)
                .toList();
        resetSqlStatementCounts();

        var actual = attractionRepo.findMatchingAttractions(Specification.allOf(), Limit.of(5)).stream()
                .map(GetAttractionResponse::from)
                .toList();

        assertThat(actual).containsExactlyInAnyOrderElementsOf(expected);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @CsvSource({
            "/search/continent/Test continent 0/attractions, 2",
            "/search/country/1/attractions, 2",
            "/search/region/1/attractions, 2",
            "/search/city/1/attractions, 2",
            "/search/attraction/1/attractions, 1",
            "/search/country/1/attractions?attractionId=5&updatedOn=2025-02-23T08:12:43, 1",
            "/search/country/2/attractions?attractionId=3&updatedOn=2024-09-14T10:10:47, 1"
    })
    void searchUsesOnlyContentAndBulkVisitStatusQueries(String path, int resultSize) throws Exception {
        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlyProjectionSelectCount(2);
    }

    @Test
    void emptySearchUsesOnlyOneProjectionQuery() throws Exception {
        mockMvc.perform(get("/search/country/999999/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 3, 5})
    void tripBoardUsesExistenceAndContentQueriesRegardlessOfSize(int resultSize) throws Exception {
        entityManager.createNativeQuery("""
                INSERT INTO trip_attraction(created_on, attraction_id, trip_id, status, attraction_group, board_position, must_visit)
                SELECT created_on, id, 1, 'PLANNED', 'SECONDARY', id, false FROM attraction WHERE id IN (4, 5)
                """).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE trip_id = 1 AND board_position > :resultSize")
                .setParameter("resultSize", resultSize)
                .executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlyProjectionSelectCount(2);
    }

    @Test
    void tripBoardProjectionPreservesAllResponseFieldsAndOptionalRelationships() {
        entityManager.createNativeQuery("""
                UPDATE trip_attraction
                SET attraction_id = 5, working_hours = '09:00-17:00', visit_time = '1 hour',
                    review_note = 'Worth returning', would_visit_again = true
                WHERE id = 3
                """).executeUpdate();
        var expected = tripAttractionRepo.findBoardAttractionsByTripId(1L).stream()
                .map(SqlQueryCountTest::toTripAttractionDetails)
                .map(GetTripAttractionResponse::from)
                .toList();
        resetSqlStatementCounts();

        var actual = tripService.getAttractions(1L).stream()
                .map(GetTripAttractionResponse::from)
                .toList();

        assertThat(actual).containsExactlyElementsOf(expected);
        assertReadOnlyProjectionSelectCount(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void bucketListRegionAndTripQueryCountDoesNotGrowWithResults(int resultSize) {
        linkBucketListItemsToRegionsAndTrips();
        resetSqlStatementCounts();

        var items = bucketListItemRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetBucketListItemResponse::from)
                .toList();

        assertThat(items).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void bucketListCityAndTripQueryCountDoesNotGrowWithResults(int resultSize) {
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET completed_on = (SELECT trip_end_date FROM trip WHERE trip.id = bucket_list_item.id),
                    would_repeat = false,
                    city_id = id,
                    trip_id = id
                """).executeUpdate();
        resetSqlStatementCounts();

        var items = bucketListItemRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetBucketListItemResponse::from)
                .toList();

        assertThat(items).hasSize(resultSize);
        assertReadOnlyProjectionSelectCount(1);
    }

    @Test
    void bucketListProjectionPreservesCityRegionAndUnlinkedItems() {
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET completed_on = (SELECT trip_end_date FROM trip WHERE trip.id = bucket_list_item.id),
                    would_repeat = false, trip_id = id
                WHERE id IN (1, 2)
                """).executeUpdate();
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item SET city_id = 3, description = 'City item', would_repeat = true WHERE id = 1
                """).executeUpdate();
        entityManager.createNativeQuery("UPDATE bucket_list_item SET region_id = 4 WHERE id = 2").executeUpdate();
        var expected = bucketListItemRepo.findAll().stream()
                .sorted(Comparator.comparing(BucketListItem::getId))
                .map(SqlQueryCountTest::toBucketListItemDetails)
                .map(GetBucketListItemResponse::from)
                .toList();
        resetSqlStatementCounts();

        var actual = bucketListItemRepo.findAllOrderByOldest(Limit.of(3)).stream()
                .map(GetBucketListItemResponse::from)
                .toList();

        assertThat(actual).containsExactlyElementsOf(expected);
        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @CsvSource({
            "/bucket-list/items?sd=ASC, 2",
            "/bucket-list/items?sd=DESC, 2",
            "/bucket-list/items?sd=ASC&itemId=2&updatedOn=2025-12-20T10:00:01, 1",
            "/bucket-list/items?sd=DESC&itemId=2&updatedOn=2025-12-20T10:00:01, 1"
    })
    void linkedBucketListPagesLoadTheirResponsesInOneSelect(String path, int resultSize) throws Exception {
        linkBucketListItemsToRegionsAndTrips();
        resetSqlStatementCounts();

        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlyProjectionSelectCount(1);
    }

    @ParameterizedTest
    @EnumSource(SearchInElement.class)
    void suggestionsUseOneProjectionQuery(SearchInElement searchIn) {
        var suggestions = searchService.suggestNames("test", searchIn, null);

        assertThat(suggestions).isNotEmpty();
        assertReadOnlySelectCount(1);
    }

    @Test
    void countryVisitSummariesUseTwoAggregateQueries() {
        var summaries = tripService.getCountryVisitSummaries();

        assertThat(summaries).hasSize(3);
        assertReadOnlySelectCount(2);
    }

    @Test
    void visitHistoryUsesOneProjectionQuery() {
        var visits = tripService.getVisitHistory(1L, List.of(1L, 2L, 3L));

        assertThat(visits).hasSize(1);
        assertReadOnlySelectCount(1);
    }

    private void linkBucketListItemsToRegionsAndTrips() {
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET completed_on = (SELECT trip_end_date FROM trip WHERE trip.id = bucket_list_item.id),
                    would_repeat = false,
                    region_id = id,
                    trip_id = id
                """).executeUpdate();
    }

    private static AttractionDetails toAttractionDetails(Attraction attraction) {
        return new AttractionDetails(
                attraction.getId(),
                attraction.getName(),
                attraction.getCity().map(City::getName).orElse(null),
                attraction.getRegion().getName(),
                attraction.getCountry().getName(),
                attraction.isCountrywide(),
                attraction.getMain().map(Attraction::getName).orElse(null),
                attraction.getAddress().orElse(null),
                attraction.getCategory(),
                attraction.getType(),
                attraction.isMustVisit(),
                attraction.isTraditional(),
                attraction.getTip().orElse(null),
                attraction.getInformationProvider().getSourceName(),
                attraction.getRecorded(),
                attraction.getOptimalVisitPeriod().orElse(null),
                attraction.getPermanentlyClosedAt(),
                attraction.getUpdatedOn().orElse(attraction.getCreatedOn()));
    }

    private static BucketListItemDetails toBucketListItemDetails(BucketListItem item) {
        var regionName = item.getRegion()
                .map(Region::getName)
                .or(() -> item.getCity().map(City::getRegion).map(Region::getName))
                .orElse(null);

        return new BucketListItemDetails(
                item.getId(),
                item.getName(),
                item.getCompletedOn(),
                item.getWouldRepeat(),
                item.getCity().map(City::getId).orElse(null),
                item.getCity().map(City::getName).orElse(null),
                item.getRegion().map(Region::getId).orElse(null),
                regionName,
                item.getDescription().orElse(null),
                item.getTrip().map(Trip::getId).orElse(null),
                item.getTrip().map(Trip::getName).orElse(null),
                item.getUpdatedOn().orElse(item.getCreatedOn()));
    }

    private static TripAttractionDetails toTripAttractionDetails(TripAttraction tripAttraction) {
        var attraction = tripAttraction.getAttraction();
        return new TripAttractionDetails(
                attraction.getId(),
                attraction.getName(),
                attraction.getCity().map(City::getName).orElse(null),
                attraction.getRegion().getName(),
                attraction.getCountry().getName(),
                attraction.isCountrywide(),
                attraction.getMain().map(Attraction::getName).orElse(null),
                attraction.getAddress().orElse(null),
                attraction.getCategory(),
                attraction.getType(),
                attraction.isTraditional(),
                attraction.getTip().orElse(null),
                attraction.getInformationProvider().getSourceName(),
                attraction.getRecorded(),
                attraction.getOptimalVisitPeriod().orElse(null),
                attraction.getPermanentlyClosedAt(),
                tripAttraction.getStatus(),
                tripAttraction.getRating(),
                tripAttraction.getNote(),
                tripAttraction.getReviewNote(),
                tripAttraction.getAttractionGroup(),
                tripAttraction.isMustVisit(),
                tripAttraction.getWorkingHours(),
                tripAttraction.getVisitTime(),
                tripAttraction.isWouldVisitAgain());
    }

    private void assertReadOnlyProjectionSelectCount(int expectedCount) {
        assertReadOnlySelectCount(expectedCount);
        assertNoManagedEntities();
    }

    private void assertNoManagedEntities() {
        var statistics = entityManager.unwrap(Session.class).getStatistics();
        assertThat(statistics.getEntityCount()).isZero();
        assertThat(statistics.getCollectionCount()).isZero();
    }

    private static void assertReadOnlySelectCount(int expectedCount) {
        assertSelectCount(expectedCount);
        assertInsertCount(0);
        assertUpdateCount(0);
        assertDeleteCount(0);
    }
}