package com.triptrove.manager;

import com.triptrove.manager.application.dto.GetAttractionResponse;
import com.triptrove.manager.application.dto.GetBucketListItemResponse;
import com.triptrove.manager.domain.model.SearchInElement;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.BucketListItemRepo;
import com.triptrove.manager.domain.service.SearchService;
import com.triptrove.manager.domain.service.TripService;
import io.hypersistence.utils.jdbc.validator.SQLStatementCountMismatchException;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static io.hypersistence.utils.jdbc.validator.SQLStatementCountValidator.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void attractionQueryCountDoesNotGrowWithResults(int resultSize) {
        var attractions = attractionRepo.findAllOrderByOldest(Limit.of(resultSize)).stream()
                .map(GetAttractionResponse::from)
                .toList();

        assertThat(attractions).hasSize(resultSize);
        assertReadOnlySelectCount(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    void specificationQueryCountDoesNotGrowWithResults(int resultSize) {
        var attractions = attractionRepo.findAll(Specification.allOf(), PageRequest.of(0, resultSize))
                .getContent().stream()
                .map(GetAttractionResponse::from)
                .toList();

        assertThat(attractions).hasSize(resultSize);
        assertReadOnlySelectCount(2);
    }

    @ParameterizedTest
    @CsvSource({
            "/search/continent/Test continent 0/attractions, 2, 3",
            "/search/country/1/attractions, 2, 3",
            "/search/region/1/attractions, 2, 3",
            "/search/city/1/attractions, 2, 3",
            "/search/attraction/1/attractions, 1, 2",
            "/search/country/999999/attractions, 0, 1"
    })
    void searchUsesOnlyContentCountAndBulkVisitStatusQueries(String path, int resultSize, int selectCount) throws Exception {
        mockMvc.perform(get(path).header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(selectCount);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void tripBoardUsesExistenceAndContentQueriesRegardlessOfSize(int resultSize) throws Exception {
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE trip_id = 1 AND id > :resultSize")
                .setParameter("resultSize", resultSize)
                .executeUpdate();
        resetSqlStatementCounts();

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(resultSize));

        assertReadOnlySelectCount(2);
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
        assertReadOnlySelectCount(1);
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
        assertReadOnlySelectCount(1);
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

        assertReadOnlySelectCount(1);
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

    private static void assertReadOnlySelectCount(int expectedCount) {
        assertSelectCount(expectedCount);
        assertInsertCount(0);
        assertUpdateCount(0);
        assertDeleteCount(0);
    }
}