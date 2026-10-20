package com.triptrove.manager;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.controller.BucketListController;
import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.model.BucketListStatusFilter;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.repo.BucketListItemRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.domain.repo.TripRepo;
import com.triptrove.manager.domain.service.BucketListService;
import com.triptrove.manager.domain.service.BucketListServiceImpl;
import com.triptrove.manager.infra.ManagerProperties;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class BucketListTest extends AbstractIntegrationTest {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final long FIRST_BUCKET_LIST_ITEM_ID = 1L;
    private static final long SECOND_BUCKET_LIST_ITEM_ID = 2L;
    private static final long THIRD_BUCKET_LIST_ITEM_ID = 3L;
    private static final long UNKNOWN_ID = 999_999L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BucketListItemRepo bucketListItemRepo;

    @Autowired
    private BucketListService bucketListService;

    @Autowired
    private CityRepo cityRepo;

    @Autowired
    private RegionRepo regionRepo;

    @Autowired
    private TripRepo tripRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    @Nested
    class ServicePreconditionTests {
        @Test
        void shouldRejectCreatingWithBothCityAndRegion() {
            assertThatThrownBy(() -> bucketListService.saveItem("Zorbing", 1, 2, null)).isInstanceOf(IllegalArgumentException.class).hasMessageContainingAll("Bucket list item cannot have both a city and a region", "cityId=1", "regionId=2");
        }

        @Test
        void shouldRejectUpdatingWithBothCityAndRegion() {
            assertThatThrownBy(() -> bucketListService.updateItemLocation(FIRST_BUCKET_LIST_ITEM_ID, 1, 2)).isInstanceOf(IllegalArgumentException.class).hasMessageContainingAll("Bucket list item cannot have both a city and a region", "cityId=1", "regionId=2");
        }

        @Test
        void shouldRejectCompletionDateWithoutTrip() {
            var completedOn = LocalDate.of(2026, 9, 16);

            assertThatThrownBy(() -> bucketListService.updateItemCompletion(FIRST_BUCKET_LIST_ITEM_ID, completedOn, null, false)).isInstanceOf(IllegalArgumentException.class).hasMessageContainingAll("completion must include both completedOn and tripId, or neither", "completedOn=2026-09-16", "tripId=null");
        }

        @Test
        void shouldRejectTripWithoutCompletionDate() {
            assertThatThrownBy(() -> bucketListService.updateItemCompletion(FIRST_BUCKET_LIST_ITEM_ID, null, 1L, false)).isInstanceOf(IllegalArgumentException.class).hasMessageContainingAll("completion must include both completedOn and tripId, or neither", "completedOn=null", "tripId=1");
        }
    }

    @Nested
    class CreateItemTests {
        @Test
        void shouldCreateBucketListItemWithRegion() throws Exception {
            int regionId = regionRepo.findAll().getFirst().getId();
            var request = new CreateBucketListItemRequest("Paragliding", null, regionId, "I want to try this from the mountains.");

            var savedItem = bucketListItemRepo.findById(createItem(request)).orElseThrow();

            assertThat(savedItem.getName()).isEqualTo(request.name());
            assertThat(savedItem.getCity()).isEmpty();
            assertThat(savedItem.getRegion()).hasValueSatisfying(region -> assertThat(region.getId()).isEqualTo(request.regionId()));
            assertThat(savedItem.getDescription()).hasValue(request.description());
            assertThat(savedItem.getWouldRepeat()).isNull();
        }

        @Test
        void shouldCreateBucketListItemWithCity() throws Exception {
            int cityId = cityRepo.findAll().getFirst().getId();
            var request = new CreateBucketListItemRequest("Kayaking", cityId, null, null);

            var savedItem = bucketListItemRepo.findById(createItem(request)).orElseThrow();

            assertThat(savedItem.getName()).isEqualTo(request.name());
            assertThat(savedItem.getCity()).hasValueSatisfying(city -> assertThat(city.getId()).isEqualTo(request.cityId()));
            assertThat(savedItem.getRegion()).isEmpty();
            assertThat(savedItem.getDescription()).isEmpty();
        }

        @Test
        void shouldCreateBucketListItemAtTextLengthLimitsWithoutLocation() throws Exception {
            var request = new CreateBucketListItemRequest("N".repeat(256), null, null, "D".repeat(4096));

            var savedItem = bucketListItemRepo.findById(createItem(request)).orElseThrow();

            assertThat(savedItem.getName()).hasSize(256);
            assertThat(savedItem.getCity()).isEmpty();
            assertThat(savedItem.getRegion()).isEmpty();
            assertThat(savedItem.getDescription()).hasValueSatisfying(description -> assertThat(description).hasSize(4096));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = "   ")
        void shouldRejectMissingBucketListItemName(String name) throws Exception {
            var request = new CreateBucketListItemRequest(name, null, null, null);

            var jsonResponse = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{name = Bucket list item name may not be null or empty}");

            assertThat(bucketListItemRepo.count()).isEqualTo(3);
        }

        @Test
        void shouldRejectBucketListItemNameAboveLengthLimit() throws Exception {
            var request = new CreateBucketListItemRequest("N".repeat(257), null, null, null);

            var jsonResponse = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{name = Bucket list item name may not be longer than 256}");
        }

        @Test
        void shouldRejectBucketListItemDescriptionAboveLengthLimit() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", null, null, "D".repeat(4097));

            var jsonResponse = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{description = Bucket list item description may not be longer than 4096}");
        }

        @Test
        void shouldRejectCityAndRegionAtTheSameTime() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", 1, 1, null);

            var jsonResponse = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{locationValid = Select either a city or a region, not both}");
        }

        @Test
        void shouldReturnNotFoundForUnknownCity() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", (int) UNKNOWN_ID, null, null);

            var jsonResponse = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        @Test
        void shouldReturnNotFoundForUnknownRegion() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", null, (int) UNKNOWN_ID, null);

            var jsonResponse = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        private long createItem(CreateBucketListItemRequest request) throws Exception {
            var response = mockMvc.perform(post("/bucket-list/items").header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isCreated()).andExpect(header().exists(HttpHeaders.LOCATION)).andReturn().getResponse();

            var locationPath = URI.create(response.getHeader(HttpHeaders.LOCATION)).getPath();
            return Long.parseLong(locationPath.substring(locationPath.lastIndexOf('/') + 1));
        }
    }

    @Nested
    class UpdateItemNameTests {
        @Test
        void shouldUpdateBucketListItemNameAtLengthLimit() throws Exception {
            var originalItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            var originalDescription = originalItem.getDescription();
            var originalCity = originalItem.getCity();
            var originalRegion = originalItem.getRegion();
            var updateRequest = new UpdateBucketListItemNameRequest("N".repeat(256));

            mockMvc.perform(put("/bucket-list/items/{id}/name", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getName()).isEqualTo(updateRequest.name());
            assertThat(updatedItem.getDescription()).isEqualTo(originalDescription);
            assertThat(updatedItem.getCity()).isEqualTo(originalCity);
            assertThat(updatedItem.getRegion()).isEqualTo(originalRegion);
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = "   ")
        void shouldRejectMissingBucketListItemName(String name) throws Exception {
            var updateRequest = new UpdateBucketListItemNameRequest(name);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/name", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{name = Bucket list item name may not be null or empty}");

            assertThat(bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow().getName()).isEqualTo("First item");
        }

        @Test
        void shouldRejectBucketListItemNameAboveLengthLimit() throws Exception {
            var updateRequest = new UpdateBucketListItemNameRequest("N".repeat(257));

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/name", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{name = Bucket list item name may not be longer than 256}");
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingNameOfUnknownItem() throws Exception {
            var updateRequest = new UpdateBucketListItemNameRequest("Paragliding");

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/name", UNKNOWN_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }
    }

    @Nested
    class UpdateItemLocationTests {
        @Test
        void shouldUpdateBucketListItemLocationToCity() throws Exception {
            var originalItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();
            var originalName = originalItem.getName();
            var originalDescription = originalItem.getDescription();
            int cityId = cityRepo.findAll().getFirst().getId();
            var updateRequest = new UpdateBucketListItemLocationRequest(cityId, null);

            mockMvc.perform(put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getCity()).hasValueSatisfying(city -> assertThat(city.getId()).isEqualTo(cityId));
            assertThat(updatedItem.getRegion()).isEmpty();
            assertThat(updatedItem.getName()).isEqualTo(originalName);
            assertThat(updatedItem.getDescription()).isEqualTo(originalDescription);
        }

        @Test
        void shouldUpdateBucketListItemLocationToRegion() throws Exception {
            int regionId = regionRepo.findAll().getFirst().getId();
            var updateRequest = new UpdateBucketListItemLocationRequest(null, regionId);

            mockMvc.perform(put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getCity()).isEmpty();
            assertThat(updatedItem.getRegion()).hasValueSatisfying(region -> assertThat(region.getId()).isEqualTo(regionId));
        }

        @Test
        void shouldClearBucketListItemLocation() throws Exception {
            var item = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setCity(cityRepo.findAll().getFirst());
            bucketListItemRepo.saveAndFlush(item);
            var updateRequest = new UpdateBucketListItemLocationRequest(null, null);

            mockMvc.perform(put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getCity()).isEmpty();
            assertThat(updatedItem.getRegion()).isEmpty();
        }

        @Test
        void shouldRejectCityAndRegionAtTheSameTime() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest(1, 1);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{locationValid = Select either a city or a region, not both}");
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingLocationToUnknownCity() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest((int) UNKNOWN_ID, null);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingLocationToUnknownRegion() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest(null, (int) UNKNOWN_ID);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingLocationOfUnknownItem() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest(null, null);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/location", UNKNOWN_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }
    }

    @Nested
    class UpdateItemDescriptionTests {
        @Test
        void shouldUpdateBucketListItemDescriptionAtLengthLimit() throws Exception {
            var originalItem = bucketListItemRepo.findById(THIRD_BUCKET_LIST_ITEM_ID).orElseThrow();
            var originalName = originalItem.getName();
            var originalCity = originalItem.getCity();
            var originalRegion = originalItem.getRegion();
            var updateRequest = new UpdateBucketListItemDescriptionRequest("D".repeat(4096));

            mockMvc.perform(put("/bucket-list/items/{id}/description", THIRD_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(THIRD_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getDescription()).hasValue(updateRequest.description());
            assertThat(updatedItem.getName()).isEqualTo(originalName);
            assertThat(updatedItem.getCity()).isEqualTo(originalCity);
            assertThat(updatedItem.getRegion()).isEqualTo(originalRegion);
        }

        @Test
        void shouldClearBucketListItemDescription() throws Exception {
            var item = bucketListItemRepo.findById(THIRD_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setDescription("Existing description");
            bucketListItemRepo.saveAndFlush(item);
            var updateRequest = new UpdateBucketListItemDescriptionRequest(null);

            mockMvc.perform(put("/bucket-list/items/{id}/description", THIRD_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNoContent());

            assertThat(bucketListItemRepo.findById(THIRD_BUCKET_LIST_ITEM_ID).orElseThrow().getDescription()).isEmpty();
        }

        @Test
        void shouldRejectBucketListItemDescriptionAboveLengthLimit() throws Exception {
            var updateRequest = new UpdateBucketListItemDescriptionRequest("D".repeat(4097));

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/description", THIRD_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{description = Bucket list item description may not be longer than 4096}");
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingDescriptionOfUnknownItem() throws Exception {
            var updateRequest = new UpdateBucketListItemDescriptionRequest("Description");

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/description", UNKNOWN_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updateRequest))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }
    }

    @Nested
    class UpdateItemCompletionTests {
        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        void shouldCompleteBucketListItemOnFirstTripDay(Boolean wouldRepeat) throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), trip.getId(), wouldRepeat);

            updateCompletion(FIRST_BUCKET_LIST_ITEM_ID, request);

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getCompletedOn()).isEqualTo(trip.getFrom());
            assertThat(updatedItem.getTrip()).hasValueSatisfying(savedTrip -> assertThat(savedTrip.getId()).isEqualTo(trip.getId()));
            assertThat(updatedItem.getWouldRepeat()).isEqualTo(wouldRepeat);
        }

        @Test
        void shouldCompleteBucketListItemOnLastTripDay() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = mapper.createObjectNode().put("completedOn", trip.getTo().toString()).put("tripId", trip.getId()).put("wouldRepeat", false);

            mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isNoContent());

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getCompletedOn()).isEqualTo(trip.getTo());
            assertThat(updatedItem.getTrip()).hasValueSatisfying(savedTrip -> assertThat(savedTrip.getId()).isEqualTo(trip.getId()));
            assertThat(updatedItem.getWouldRepeat()).isFalse();
        }

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        void shouldUpdateRepeatPreferenceForCompletedItem(Boolean wouldRepeat) throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var item = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setCompletedOn(trip.getFrom());
            item.setTrip(trip);
            item.setWouldRepeat(!wouldRepeat);
            bucketListItemRepo.saveAndFlush(item);

            updateCompletion(FIRST_BUCKET_LIST_ITEM_ID, new UpdateBucketListItemCompletionRequest(trip.getFrom(), trip.getId(), wouldRepeat));

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getWouldRepeat()).isEqualTo(wouldRepeat);
            assertThat(updatedItem.getCompletedOn()).isEqualTo(trip.getFrom());
            assertThat(updatedItem.getTrip()).hasValueSatisfying(savedTrip -> assertThat(savedTrip.getId()).isEqualTo(trip.getId()));
        }

        @Test
        void shouldRejectCompletionWithNullRepeatPreference() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), trip.getId(), null);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{tripValid = A completed bucket list item must have a trip and a repeat preference}");
        }

        @Test
        void shouldRejectCompletionWithoutRepeatPreference() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), trip.getId(), null);
            var requestJson = mapper.copy().setSerializationInclusion(JsonInclude.Include.NON_NULL).writeValueAsString(request);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(requestJson)).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{tripValid = A completed bucket list item must have a trip and a repeat preference}");

            var unchangedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(unchangedItem.getCompletedOn()).isNull();
            assertThat(unchangedItem.getTrip()).isEmpty();
            assertThat(unchangedItem.getWouldRepeat()).isNull();
        }

        @ParameterizedTest
        @NullSource
        @ValueSource(booleans = {true, false})
        void shouldClearBucketListItemCompletion(Boolean wouldRepeat) throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var item = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setCompletedOn(trip.getFrom());
            item.setTrip(trip);
            item.setWouldRepeat(true);
            bucketListItemRepo.saveAndFlush(item);
            var request = new UpdateBucketListItemCompletionRequest(null, null, wouldRepeat);

            updateCompletion(FIRST_BUCKET_LIST_ITEM_ID, request);

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getCompletedOn()).isNull();
            assertThat(updatedItem.getTrip()).isEmpty();
            assertThat(updatedItem.getWouldRepeat()).isNull();
            mockMvc.perform(get("/bucket-list/items/{id}", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1")).andExpect(status().isOk()).andExpect(jsonPath("$.wouldRepeat").value(nullValue()));
        }

        @Test
        void shouldRejectCompletionDateWithoutTrip() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), null, false);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{tripValid = A completed bucket list item must have a trip and a repeat preference}");
        }

        @Test
        void shouldRejectTripWithoutCompletionDate() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(null, trip.getId(), false);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("{tripValid = A completed bucket list item must have a trip and a repeat preference}");
        }

        @Test
        void shouldRejectCompletionDateBeforeTrip() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom().minusDays(1), trip.getId(), false);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("Completion date '%s' must be between '%s' and '%s'.".formatted(request.completedOn(), trip.getFrom(), trip.getTo()));
        }

        @Test
        void shouldRejectCompletionDateAfterTrip() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getTo().plusDays(1), trip.getId(), false);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
            assertThat(actual.errorMessage()).isEqualTo("Completion date '%s' must be between '%s' and '%s'.".formatted(request.completedOn(), trip.getFrom(), trip.getTo()));
        }

        @Test
        void shouldReturnNotFoundForUnknownTrip() throws Exception {
            var request = new UpdateBucketListItemCompletionRequest(java.time.LocalDate.now(), UNKNOWN_ID, false);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingCompletionOfUnknownItem() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), trip.getId(), false);

            var jsonResponse = mockMvc.perform(put("/bucket-list/items/{id}/completion", UNKNOWN_ID).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        private void updateCompletion(long itemId, UpdateBucketListItemCompletionRequest request) throws Exception {
            mockMvc.perform(put("/bucket-list/items/{id}/completion", itemId).header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isNoContent());
        }
    }

    @Nested
    class DeleteItemTests {
        @Test
        void shouldDeleteBucketListItem() throws Exception {
            mockMvc.perform(delete("/bucket-list/items/{id}", FIRST_BUCKET_LIST_ITEM_ID).header("x-api-version", "1")).andExpect(status().isNoContent());

            assertThat(bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID)).isEmpty();
        }

        @Test
        void shouldReturnNotFoundWhenDeletingUnknownItem() throws Exception {
            var jsonResponse = mockMvc.perform(delete("/bucket-list/items/{id}", UNKNOWN_ID).header("x-api-version", "1")).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }
    }

    @Nested
    class ListItemsTests {
        @ParameterizedTest
        @CsvSource(value = {
                "/bucket-list/items?status=COMPLETED&sd=ASC | First item;Third item",
                "/bucket-list/items?status=COMPLETED&sd=DESC | Third item;First item",
                "/bucket-list/items?status=TODO&sd=ASC | Second item",
                "/bucket-list/items?status=TODO&sd=DESC | Second item"
        }, delimiter = '|')
        void shouldApplyStatusBeforePagingInBothDirections(String path, String expectedNames) throws Exception {
            entityManager.createNativeQuery("""
                    UPDATE bucket_list_item
                    SET completed_on = (SELECT trip_start_date FROM trip WHERE id = 1),
                        trip_id = 1
                    WHERE id IN (1, 3)
                    """).executeUpdate();
            entityManager.clear();

            var json = mockMvc.perform(get(path.trim())
                            .header("x-api-version", "1"))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            var items = mapper.readValue(json, GetBucketListItemResponse[].class);
            var expected = Arrays.stream(expectedNames.trim().split(";")).toArray(String[]::new);
            assertThat(items).extracting(GetBucketListItemResponse::name)
                    .containsExactly(expected);
        }

        @Test
        void shouldReturnAnEmptyCompletedPageWhenTheCompleteDatasetHasNoMatches() throws Exception {
            mockMvc.perform(get("/bucket-list/items")
                            .header("x-api-version", "1")
                            .param("status", "COMPLETED"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));
        }

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        void shouldReturnRepeatPreferenceForCompletedItem(Boolean wouldRepeat) throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var item = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setCompletedOn(trip.getFrom());
            item.setTrip(trip);
            item.setWouldRepeat(wouldRepeat);
            bucketListItemRepo.saveAndFlush(item);

            var items = getItems(null, null, null);

            assertThat(items).filteredOn(response -> response.id() == FIRST_BUCKET_LIST_ITEM_ID).singleElement().extracting(GetBucketListItemResponse::wouldRepeat).isEqualTo(wouldRepeat);
        }

        @Test
        void shouldReturnItemsInPagesInDescendingOrderByDefault() throws Exception {
            var firstPage = getItems(null, null, null);

            assertThat(firstPage).hasSize(2);
            assertThat(firstPage).extracting(GetBucketListItemResponse::name).containsExactly("Third item", "Second item");

            var secondPage = getItems(null, firstPage[1].id(), firstPage[1].changedOn().toString());
            assertThat(secondPage).extracting(GetBucketListItemResponse::name).containsExactly("First item");

            var pageAfterLastItem = getItems(null, secondPage[0].id(), secondPage[0].changedOn().toString());
            assertThat(pageAfterLastItem).isEmpty();
        }

        @Test
        void shouldReturnItemsInPagesInAscendingOrder() throws Exception {
            var firstPage = getItems("ASC", null, null);

            assertThat(firstPage).hasSize(2);
            assertThat(firstPage).extracting(GetBucketListItemResponse::name).containsExactly("First item", "Second item");

            var secondPage = getItems("ASC", firstPage[1].id(), firstPage[1].changedOn().toString());
            assertThat(secondPage).extracting(GetBucketListItemResponse::name).containsExactly("Third item");

            var pageAfterLastItem = getItems("ASC", secondPage[0].id(), secondPage[0].changedOn().toString());
            assertThat(pageAfterLastItem).isEmpty();
        }

        @Test
        void shouldReturnEmptyListWhenNoBucketListItemsExist() throws Exception {
            bucketListItemRepo.deleteAll();

            assertThat(getItems(null, null, null)).isEmpty();
        }

        private GetBucketListItemResponse[] getItems(String sortDirection, Long itemId, String updatedOn) throws Exception {
            var request = get("/bucket-list/items").header("x-api-version", "1");
            if (sortDirection != null) {
                request.param("sd", sortDirection);
            }
            if (itemId != null) {
                request.param("itemId", itemId.toString());
            }
            if (updatedOn != null) {
                request.param("updatedOn", updatedOn);
            }

            var json = mockMvc.perform(request).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            return mapper.readValue(json, GetBucketListItemResponse[].class);
        }
    }

    @Nested
    class CountItemsTests {
        @Test
        void shouldReturnZeroCountsWhenTheBucketListIsEmpty() throws Exception {
            bucketListItemRepo.deleteAll();

            mockMvc.perform(get("/bucket-list/items/counts")
                            .header("x-api-version", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.all").value(0))
                    .andExpect(jsonPath("$.todo").value(0))
                    .andExpect(jsonPath("$.completed").value(0));
        }

        @Test
        void shouldReflectCompletionAndReopeningThroughTheReadInterfaces() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var completion = new UpdateBucketListItemCompletionRequest(
                    trip.getFrom(), trip.getId(), true);

            mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                            .header("x-api-version", "1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(completion)))
                    .andExpect(status().isNoContent());
            mockMvc.perform(get("/bucket-list/items")
                            .header("x-api-version", "1")
                            .param("status", "COMPLETED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(FIRST_BUCKET_LIST_ITEM_ID));
            mockMvc.perform(get("/bucket-list/items/counts")
                            .header("x-api-version", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.all").value(3))
                    .andExpect(jsonPath("$.todo").value(2))
                    .andExpect(jsonPath("$.completed").value(1));

            var reopening = new UpdateBucketListItemCompletionRequest(null, null, null);
            mockMvc.perform(put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                            .header("x-api-version", "1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(reopening)))
                    .andExpect(status().isNoContent());
            mockMvc.perform(get("/bucket-list/items")
                            .header("x-api-version", "1")
                            .param("status", "COMPLETED"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));
            mockMvc.perform(get("/bucket-list/items/counts")
                            .header("x-api-version", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.all").value(3))
                    .andExpect(jsonPath("$.todo").value(3))
                    .andExpect(jsonPath("$.completed").value(0));
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("filteredPaginationScenarios")
    void shouldTraverseEveryFilteredPaginationScenario(BucketListPaginationScenario scenario) throws Exception {
        replaceBucketListFixtureForPagination(scenario.totalSize());

        var service = new BucketListServiceImpl(
                new ManagerProperties(scenario.pageSize(), 1, 195),
                bucketListItemRepo, cityRepo, regionRepo, tripRepo);
        var scenarioMockMvc = MockMvcBuilders
                .standaloneSetup(new BucketListController(service))
                .build();
        var requestCount = Math.ceilDiv(scenario.expectedIds().size(), scenario.pageSize()) + 1;

        var pages = new ArrayList<List<GetBucketListItemResponse>>();
        pages.add(getFilteredItems(scenarioMockMvc, scenario.filter(), "DESC"));
        for (int pageNumber = 1; pageNumber < requestCount; pageNumber++) {
            var lastItem = pages.getLast().getLast();
            pages.add(getFilteredItems(
                    scenarioMockMvc,
                    scenario.filter(),
                    "DESC",
                    new ScrollPosition(lastItem.id(), lastItem.changedOn())));
        }
        var returnedItems = pages.stream().flatMap(List::stream).toList();
        var returnedIds = returnedItems.stream()
                .map(GetBucketListItemResponse::id)
                .toList();

        assertThat(pages.getLast()).isEmpty();
        assertThat(pages.subList(0, pages.size() - 1))
                .allSatisfy(page -> assertThat(page)
                        .isNotEmpty()
                        .hasSizeLessThanOrEqualTo(scenario.pageSize()));
        assertThat(returnedItems).allMatch(scenario.membership());
        assertThat(returnedIds)
                .containsExactlyElementsOf(scenario.expectedIds())
                .doesNotHaveDuplicates();

        var countsJson = scenarioMockMvc.perform(get("/bucket-list/items/counts")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var counts = mapper.readValue(countsJson, GetBucketListCountsResponse.class);
        assertThat(counts.all()).isEqualTo(scenario.totalSize());
        assertThat(counts.todo()).isEqualTo(scenario.todoCount());
        assertThat(counts.completed()).isEqualTo(scenario.completedCount());
    }

    @ParameterizedTest
    @CsvSource(value = {
            "ALL       | ASC  | 90;100;30;40;50;60;70;80;10;20",
            "ALL       | DESC | 20;10;80;70;60;50;40;30;100;90",
            "TODO      | ASC  | 90;30;50;70;10",
            "TODO      | DESC | 10;70;50;30;90",
            "COMPLETED | ASC  | 100;40;60;80;20",
            "COMPLETED | DESC | 20;80;60;40;100"
    }, delimiter = '|')
    void shouldTraverseEditedAndNeverEditedItemsByEffectiveTimeThenId(
            BucketListStatusFilter filter, String direction, String expectedIds) throws Exception {
        insertBucketListItemsWithEffectiveTimeTies();

        var pages = new ArrayList<List<GetBucketListItemResponse>>();
        pages.add(getFilteredItems(mockMvc, filter, direction));
        readRemainingFilteredPages(pages, filter, direction, expectedIds);

        assertFilteredTraversal(pages, expectedIds);
        var items = pages.stream().flatMap(List::stream).toList();
        assertThat(items).filteredOn(item -> List.of(90L, 100L).contains(item.id()))
                .extracting(GetBucketListItemResponse::changedOn)
                .containsOnly(LocalDateTime.parse("2026-09-28T12:00:01.000001"));
        assertThat(items).filteredOn(item -> List.of(30L, 40L, 50L, 60L, 70L, 80L).contains(item.id()))
                .extracting(GetBucketListItemResponse::changedOn)
                .containsOnly(LocalDateTime.parse("2026-09-28T12:00:02.000002"));
        assertThat(items).filteredOn(item -> List.of(10L, 20L).contains(item.id()))
                .extracting(GetBucketListItemResponse::changedOn)
                .containsOnly(LocalDateTime.parse("2026-09-28T12:00:03.000003"));
        assertBucketListCounts(10, 5, 5);
    }

    @ParameterizedTest
    @CsvSource(value = {
            "ALL       | ASC  | 10;20;30;40;50;60;70;80;90;100",
            "ALL       | DESC | 100;90;80;70;60;50;40;30;20;10",
            "TODO      | ASC  | 10;30;50;70;90",
            "TODO      | DESC | 90;70;50;30;10",
            "COMPLETED | ASC  | 20;40;60;80;100",
            "COMPLETED | DESC | 100;80;60;40;20"
    }, delimiter = '|')
    void shouldTraverseEqualEffectiveTimesUsingTheIdentifierInBothDirections(
            BucketListStatusFilter filter, String direction, String expectedIds) throws Exception {
        insertBucketListItemsWithEffectiveTimeTies();
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET created_on = CASE WHEN updated_on IS NULL
                                      THEN TIMESTAMP '2026-09-29 08:30:00.123456' ELSE created_on END,
                    updated_on = CASE WHEN updated_on IS NOT NULL
                                      THEN TIMESTAMP '2026-09-29 08:30:00.123456' END
                """).executeUpdate();
        entityManager.clear();

        var pages = new ArrayList<List<GetBucketListItemResponse>>();
        pages.add(getFilteredItems(mockMvc, filter, direction));
        readRemainingFilteredPages(pages, filter, direction, expectedIds);

        assertFilteredTraversal(pages, expectedIds);
        assertThat(pages.stream().flatMap(List::stream))
                .extracting(GetBucketListItemResponse::changedOn)
                .containsOnly(LocalDateTime.parse("2026-09-29T08:30:00.123456"));
        assertBucketListCounts(10, 5, 5);
    }

    @ParameterizedTest
    @CsvSource(value = {
            "ALL       | ASC  | 90;100;30;40;50;60;70;80;10;20 | 5 | 4",
            "ALL       | DESC | 20;10;80;70;60;50;40;30;100;90 | 4 | 5",
            "TODO      | ASC  | 90;30;50;70;10                | 4 | 5",
            "TODO      | DESC | 10;70;50;30;90                | 4 | 5",
            "COMPLETED | ASC  | 100;40;60;80;20               | 5 | 4",
            "COMPLETED | DESC | 20;80;60;40;100               | 5 | 4"
    }, delimiter = '|')
    void shouldContinueFilteredTraversalAfterDeletingTheCursorAnchor(
            BucketListStatusFilter filter, String direction, String expectedIds,
            int remainingTodo, int remainingCompleted) throws Exception {
        insertBucketListItemsWithEffectiveTimeTies();
        assertBucketListCounts(10, 5, 5);
        var pages = new ArrayList<List<GetBucketListItemResponse>>();
        pages.add(getFilteredItems(mockMvc, filter, direction));
        var anchor = pages.getLast().getLast();

        mockMvc.perform(delete("/bucket-list/items/{id}", anchor.id()).header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        readRemainingFilteredPages(pages, filter, direction, expectedIds);

        assertFilteredTraversal(pages, expectedIds);
        assertBucketListCounts(9, remainingTodo, remainingCompleted);
    }

    @ParameterizedTest
    @CsvSource(value = {
            "ALL       | ASC  | 90;100;30;40;50;60;70;80;10;20",
            "ALL       | DESC | 20;10;80;70;60;50;40;30;100;90",
            "TODO      | ASC  | 90;30;50;70;10",
            "TODO      | DESC | 10;70;50;30;90",
            "COMPLETED | ASC  | 100;40;60;80;20",
            "COMPLETED | DESC | 20;80;60;40;100"
    }, delimiter = '|')
    void shouldReturnIdenticalFilteredPagesWhenReplayingValidCursors(
            BucketListStatusFilter filter, String direction, String expectedIds) throws Exception {
        insertBucketListItemsWithEffectiveTimeTies();
        var pages = new ArrayList<List<GetBucketListItemResponse>>();
        pages.add(getFilteredItems(mockMvc, filter, direction));
        var requestCount = Math.ceilDiv(expectedIds.split(";").length, 2) + 1;

        for (int pageNumber = 1; pageNumber < requestCount; pageNumber++) {
            assertThat(pages.getLast()).isNotEmpty();
            var lastItem = pages.getLast().getLast();
            var cursor = new ScrollPosition(lastItem.id(), lastItem.changedOn());
            var nextPage = getFilteredItems(mockMvc, filter, direction, cursor);
            var replayedPage = getFilteredItems(mockMvc, filter, direction, cursor);

            assertThat(replayedPage).hasSizeLessThanOrEqualTo(2).containsExactlyElementsOf(nextPage);
            pages.add(nextPage);
        }

        assertFilteredTraversal(pages, expectedIds);
        assertBucketListCounts(10, 5, 5);
    }

    @Nested
    class GetItemTests {
        @Test
        void shouldReturnBucketListItemWithoutOptionalFields() throws Exception {
            var item = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();

            var response = getItem(FIRST_BUCKET_LIST_ITEM_ID);

            assertThat(response.id()).isEqualTo(item.getId());
            assertThat(response.name()).isEqualTo(item.getName());
            assertThat(response.completedOn()).isNull();
            assertThat(response.wouldRepeat()).isNull();
            assertThat(response.cityId()).isNull();
            assertThat(response.cityName()).isNull();
            assertThat(response.regionId()).isNull();
            assertThat(response.regionName()).isNull();
            assertThat(response.description()).isNull();
            assertThat(response.tripId()).isNull();
            assertThat(response.tripName()).isNull();
            assertThat(response.changedOn()).isEqualTo(item.getCreatedOn());
        }

        @Test
        void shouldReturnCityAndItsRegionName() throws Exception {
            var city = cityRepo.findAll().getFirst();
            var item = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setCity(city);
            bucketListItemRepo.saveAndFlush(item);

            var response = getItem(FIRST_BUCKET_LIST_ITEM_ID);

            assertThat(response.cityId()).isEqualTo(city.getId());
            assertThat(response.cityName()).isEqualTo(city.getName());
            assertThat(response.regionId()).isNull();
            assertThat(response.regionName()).isEqualTo(city.getRegion().getName());
        }

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        void shouldReturnRegionDescriptionTripCompletionAndRepeatPreference(Boolean wouldRepeat) throws Exception {
            var region = regionRepo.findAll().getFirst();
            var trip = tripRepo.findAll().getFirst();
            var item = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setRegion(region);
            item.setDescription("Fly over the mountains");
            item.setCompletedOn(trip.getFrom());
            item.setTrip(trip);
            item.setWouldRepeat(wouldRepeat);
            bucketListItemRepo.saveAndFlush(item);

            var response = getItem(FIRST_BUCKET_LIST_ITEM_ID);

            assertThat(response.regionId()).isEqualTo(region.getId());
            assertThat(response.regionName()).isEqualTo(region.getName());
            assertThat(response.description()).isEqualTo(item.getDescription().orElseThrow());
            assertThat(response.completedOn()).isEqualTo(trip.getFrom());
            assertThat(response.wouldRepeat()).isEqualTo(wouldRepeat);
            assertThat(response.tripId()).isEqualTo(trip.getId());
            assertThat(response.tripName()).isEqualTo(trip.getName());
            assertThat(response.changedOn()).isCloseTo(item.getUpdatedOn().orElseThrow(), within(1, ChronoUnit.MILLIS));
        }

        @Test
        void shouldReturnNotFoundForUnknownBucketListItem() throws Exception {
            var jsonResponse = mockMvc.perform(get("/bucket-list/items/{id}", UNKNOWN_ID).header("x-api-version", "1")).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();

            var actual = mapper.readValue(jsonResponse, ErrorResponse.class);
            assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.OBJECT_NOT_FOUND);
            assertThat(actual.errorMessage()).isEqualTo("The requested resource '999999' could not be found. Please refresh and try again.");
        }

        private GetBucketListItemResponse getItem(long itemId) throws Exception {
            var json = mockMvc.perform(get("/bucket-list/items/{id}", itemId).header("x-api-version", "1")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            return mapper.readValue(json, GetBucketListItemResponse.class);
        }
    }

    private static Stream<BucketListPaginationScenario> filteredPaginationScenarios() {
        return IntStream.of(1, 2, 20, 100)
                .boxed()
                .flatMap(pageSize -> IntStream.of(
                                0, 1, pageSize - 1, pageSize, pageSize + 1, 2 * pageSize)
                        .distinct()
                        .mapToObj(matchingSize -> Stream.of(
                                allPaginationScenario(pageSize, matchingSize),
                                todoPaginationScenario(pageSize, matchingSize),
                                completedPaginationScenario(pageSize, matchingSize)))
                        .flatMap(scenarios -> scenarios));
    }

    private void replaceBucketListFixtureForPagination(int totalSize) {
        entityManager.createNativeQuery("DELETE FROM bucket_list_item").executeUpdate();
        entityManager.createNativeQuery("""
                INSERT INTO bucket_list_item(
                    id, created_on, updated_on, name, completed_on, would_repeat,
                    city_id, region_id, trip_id, description)
                SELECT generated.id,
                       TIMESTAMP '2026-09-28 12:00:00' + generated.id * INTERVAL '1 microsecond',
                       null,
                       'Repeated experience',
                       CASE WHEN mod(generated.id, 2) = 0
                            THEN (SELECT trip_start_date FROM trip WHERE id = 1)
                       END,
                       CASE WHEN mod(generated.id, 2) = 0 THEN false END,
                       null,
                       null,
                       CASE WHEN mod(generated.id, 2) = 0 THEN 1 END,
                       null
                FROM generate_series(1, :totalSize) AS generated(id)
                """)
                .setParameter("totalSize", totalSize)
                .executeUpdate();
        entityManager.clear();
    }

    private void insertBucketListItemsWithEffectiveTimeTies() {
        entityManager.createNativeQuery("DELETE FROM bucket_list_item").executeUpdate();
        entityManager.createNativeQuery("""
                INSERT INTO bucket_list_item(
                    id, created_on, updated_on, name, completed_on, would_repeat,
                    city_id, region_id, trip_id, description)
                SELECT fixture.id, fixture.created_on, fixture.updated_on, 'Repeated experience',
                       trip.trip_start_date, CASE WHEN fixture.trip_id IS NOT NULL THEN false END,
                       fixture.city_id, fixture.region_id, fixture.trip_id, 'Populated description'
                FROM (VALUES
                    (90, TIMESTAMP '2026-09-28 12:00:01.000001', null, 1, null, null),
                    (30, TIMESTAMP '2026-09-27 12:00:00', TIMESTAMP '2026-09-28 12:00:02.000002', null, 2, null),
                    (50, TIMESTAMP '2026-09-28 12:00:02.000002', null, null, null, null),
                    (70, TIMESTAMP '2026-09-26 12:00:00', TIMESTAMP '2026-09-28 12:00:02.000002', 3, null, null),
                    (10, TIMESTAMP '2026-09-25 12:00:00', TIMESTAMP '2026-09-28 12:00:03.000003', null, 4, null),
                    (100, TIMESTAMP '2026-09-27 12:00:00', TIMESTAMP '2026-09-28 12:00:01.000001', 2, null, 1),
                    (40, TIMESTAMP '2026-09-28 12:00:02.000002', null, null, 3, 2),
                    (60, TIMESTAMP '2026-09-26 12:00:00', TIMESTAMP '2026-09-28 12:00:02.000002', 4, null, 3),
                    (80, TIMESTAMP '2026-09-28 12:00:02.000002', null, null, 5, 4),
                    (20, TIMESTAMP '2026-09-28 12:00:03.000003', null, null, null, 5)
                ) AS fixture(id, created_on, updated_on, city_id, region_id, trip_id)
                LEFT JOIN trip ON trip.id = fixture.trip_id
                """).executeUpdate();
        entityManager.clear();
    }

    private void readRemainingFilteredPages(
            List<List<GetBucketListItemResponse>> pages,
            BucketListStatusFilter filter, String direction, String expectedIds) throws Exception {
        var requestCount = Math.ceilDiv(expectedIds.split(";").length, 2) + 1;
        for (int pageNumber = pages.size(); pageNumber < requestCount; pageNumber++) {
            assertThat(pages.getLast()).isNotEmpty();
            var lastItem = pages.getLast().getLast();
            pages.add(getFilteredItems(mockMvc, filter, direction,
                    new ScrollPosition(lastItem.id(), lastItem.changedOn())));
        }
    }

    private static void assertFilteredTraversal(
            List<List<GetBucketListItemResponse>> pages, String expectedIds) {
        assertThat(pages.getLast()).isEmpty();
        assertThat(pages.subList(0, pages.size() - 1))
                .allSatisfy(page -> assertThat(page).isNotEmpty().hasSizeLessThanOrEqualTo(2));
        var items = pages.stream().flatMap(List::stream).toList();
        assertThat(items).extracting(GetBucketListItemResponse::id)
                .containsExactlyElementsOf(Arrays.stream(expectedIds.split(";")).map(Long::valueOf).toList())
                .doesNotHaveDuplicates();
        assertThat(items).allSatisfy(item -> assertThat(item.completedOn() != null)
                .isEqualTo(List.of(20L, 40L, 60L, 80L, 100L).contains(item.id())));
    }

    private void assertBucketListCounts(int all, int todo, int completed) throws Exception {
        mockMvc.perform(get("/bucket-list/items/counts").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all").value(all))
                .andExpect(jsonPath("$.todo").value(todo))
                .andExpect(jsonPath("$.completed").value(completed));
    }

    private static List<GetBucketListItemResponse> getFilteredItems(
            MockMvc scenarioMockMvc, BucketListStatusFilter filter, String direction) throws Exception {
        var json = scenarioMockMvc.perform(get("/bucket-list/items")
                        .header("x-api-version", "1")
                        .param("status", filter.name())
                        .param("sd", direction))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Arrays.asList(mapper.readValue(json, GetBucketListItemResponse[].class));
    }

    private static List<GetBucketListItemResponse> getFilteredItems(
            MockMvc scenarioMockMvc, BucketListStatusFilter filter, String direction, ScrollPosition after) throws Exception {
        var json = scenarioMockMvc.perform(get("/bucket-list/items")
                        .header("x-api-version", "1")
                        .param("status", filter.name())
                        .param("sd", direction)
                        .param("itemId", Long.toString(after.elementId()))
                        .param("updatedOn", after.updatedOn().toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Arrays.asList(mapper.readValue(json, GetBucketListItemResponse[].class));
    }

    private static BucketListPaginationScenario allPaginationScenario(int pageSize, int matchingSize) {
        var expectedIds = IntStream.rangeClosed(1, matchingSize)
                .mapToLong(id -> matchingSize - id + 1L)
                .boxed()
                .toList();
        return new BucketListPaginationScenario(
                "ALL page size %d matching size %d".formatted(pageSize, matchingSize),
                pageSize,
                BucketListStatusFilter.ALL,
                matchingSize,
                expectedIds,
                (matchingSize + 1L) / 2L,
                matchingSize / 2L,
                item -> true);
    }

    private static BucketListPaginationScenario todoPaginationScenario(int pageSize, int matchingSize) {
        var expectedIds = IntStream.range(0, matchingSize)
                .mapToLong(index -> 2L * matchingSize - 2L * index - 1L)
                .boxed()
                .toList();
        return new BucketListPaginationScenario(
                "TODO page size %d matching size %d".formatted(pageSize, matchingSize),
                pageSize,
                BucketListStatusFilter.TODO,
                2 * matchingSize,
                expectedIds,
                matchingSize,
                matchingSize,
                item -> item.completedOn() == null);
    }

    private static BucketListPaginationScenario completedPaginationScenario(int pageSize, int matchingSize) {
        var expectedIds = IntStream.range(0, matchingSize)
                .mapToLong(index -> 2L * matchingSize - 2L * index)
                .boxed()
                .toList();
        return new BucketListPaginationScenario(
                "COMPLETED page size %d matching size %d".formatted(pageSize, matchingSize),
                pageSize,
                BucketListStatusFilter.COMPLETED,
                2 * matchingSize,
                expectedIds,
                matchingSize,
                matchingSize,
                item -> item.completedOn() != null);
    }

    private record BucketListPaginationScenario(
            String name,
            int pageSize,
            BucketListStatusFilter filter,
            int totalSize,
            List<Long> expectedIds,
            long todoCount,
            long completedCount,
            Predicate<GetBucketListItemResponse> membership) {
        @Override
        public String toString() {
            return name;
        }
    }
}
