package com.triptrove.manager;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.BucketListItemRepo;
import com.triptrove.manager.domain.repo.TripAttractionRepo;
import com.triptrove.manager.domain.service.TripService;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql("/db/attractions-test-data.sql")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReadProjectionTest extends AbstractIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AttractionRepo attractionRepo;

    @Autowired
    private BucketListItemRepo bucketListItemRepo;

    @Autowired
    private TripAttractionRepo tripAttractionRepo;

    @Autowired
    private TripService tripService;

    @Test
    void attractionListPreservesAllResponseFieldsAndOptionalRelationships() {
        var expected = attractionRepo.findAll().stream()
                .sorted(Comparator.comparing(Attraction::getId))
                .map(ReadProjectionTest::toAttractionDetails)
                .map(GetAttractionResponse::from).toList();
        entityManager.clear();

        var actual = attractionRepo.findAllOrderByOldest(Limit.of(5)).stream()
                .map(GetAttractionResponse::from).toList();

        assertThat(actual).containsExactlyElementsOf(expected);
    }

    @Test
    void attractionSearchPreservesAllResponseFieldsAndOptionalRelationships() {
        var expected = attractionRepo.findAll().stream()
                .map(ReadProjectionTest::toAttractionDetails)
                .map(GetAttractionResponse::from).toList();
        entityManager.clear();

        var actual = attractionRepo.findMatchingAttractions(Specification.allOf(), Limit.of(5)).stream()
                .map(GetAttractionResponse::from).toList();

        assertThat(actual).containsExactlyInAnyOrderElementsOf(expected);
    }

    @Test
    void tripBoardPreservesAllResponseFieldsAndOptionalRelationships() {
        KeysetTestFixtures.populateTripBoardDetails(entityManager);
        var expected = tripAttractionRepo.findBoardAttractionsByTripId(1L).stream()
                .map(ReadProjectionTest::toTripAttractionDetails)
                .map(GetTripAttractionResponse::from).toList();
        entityManager.clear();

        var actual = tripService.getAttractions(1L).stream().map(GetTripAttractionResponse::from).toList();

        assertThat(actual).containsExactlyElementsOf(expected);
    }

    @Test
    void bucketListPreservesCityRegionAndUnlinkedItems() {
        KeysetTestFixtures.populateBucketListDetails(entityManager);
        var expected = bucketListItemRepo.findAll().stream()
                .sorted(Comparator.comparing(BucketListItem::getId))
                .map(ReadProjectionTest::toBucketListItemDetails)
                .map(GetBucketListItemResponse::from).toList();
        entityManager.clear();

        var actual = bucketListItemRepo.findAllOrderByOldest(BucketListStatusFilter.ALL, Limit.of(3)).stream()
                .map(GetBucketListItemResponse::from).toList();

        assertThat(actual).containsExactlyElementsOf(expected);
    }

    @Test
    void attractionDetailsReturnCityMainAttractionAndAddress() throws Exception {
        KeysetTestFixtures.populateAttractionDetails(entityManager);

        mockMvc.perform(get("/attractions/5").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attractionId").value(5))
                .andExpect(jsonPath("$.cityName").value("Test city 0"))
                .andExpect(jsonPath("$.mainAttractionName").value("Test attraction 0"))
                .andExpect(jsonPath("$.attractionAddress").value("Full details address"));
    }

    @Test
    void bucketListDetailsReturnRegionAndTripNames() throws Exception {
        KeysetTestFixtures.linkBucketListItemsToRegionsAndTrips(entityManager);

        mockMvc.perform(get("/bucket-list/items/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.regionName").value("Test region 0"))
                .andExpect(jsonPath("$.tripName").value("Test trip name 1"));
    }

    @Test
    void citySummaryReturnsRegionAndCountryNames() throws Exception {
        mockMvc.perform(get("/cities/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cityId").value(1))
                .andExpect(jsonPath("$.regionName").value("Test region 0"))
                .andExpect(jsonPath("$.countryName").value("Test country 0"));
    }

    @Test
    void countrySummaryReturnsContinentNameAndIsoCode() throws Exception {
        mockMvc.perform(get("/countries/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countryId").value(1))
                .andExpect(jsonPath("$.continentName").value("Test continent 0"))
                .andExpect(jsonPath("$.isoCode").value("aa"));
    }

    @Test
    void regionSummaryReturnsRegionAndCountryNames() throws Exception {
        mockMvc.perform(get("/regions/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regionId").value(1))
                .andExpect(jsonPath("$.regionName").value("Test region 0"))
                .andExpect(jsonPath("$.countryName").value("Test country 0"));
    }

    @Test
    void bucketListCountersSeparateTodoAndCompletedItems() throws Exception {
        KeysetTestFixtures.prepareMixedBucketListItems(entityManager);

        mockMvc.perform(get("/bucket-list/items/counts").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all").value(3))
                .andExpect(jsonPath("$.todo").value(1))
                .andExpect(jsonPath("$.completed").value(2));
    }

    @Test
    void bucketListCountersIncludeEveryGeneratedItem() throws Exception {
        KeysetTestFixtures.insertMixedBucketListDataset(entityManager, 40);

        mockMvc.perform(get("/bucket-list/items/counts").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all").value(43))
                .andExpect(jsonPath("$.todo").value(23))
                .andExpect(jsonPath("$.completed").value(20));
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
}
