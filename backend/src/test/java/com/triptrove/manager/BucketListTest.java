package com.triptrove.manager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.CreateBucketListItemRequest;
import com.triptrove.manager.application.dto.GetBucketListItemResponse;
import com.triptrove.manager.application.dto.UpdateBucketListItemCompletionRequest;
import com.triptrove.manager.application.dto.UpdateBucketListItemDescriptionRequest;
import com.triptrove.manager.application.dto.UpdateBucketListItemLocationRequest;
import com.triptrove.manager.application.dto.UpdateBucketListItemNameRequest;
import com.triptrove.manager.domain.repo.BucketListItemRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.domain.repo.TripRepo;

import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.net.URI;

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
    class CreateItemTests {
        @Test
        void shouldCreateBucketListItemWithRegion() throws Exception {
            int regionId = regionRepo.findAll().getFirst().getId();
            var request =
                    new CreateBucketListItemRequest(
                            "Paragliding",
                            null,
                            regionId,
                            "I want to try this from the mountains.");

            var savedItem = bucketListItemRepo.findById(createItem(request)).orElseThrow();

            assertThat(savedItem.getName()).isEqualTo(request.name());
            assertThat(savedItem.getCity()).isEmpty();
            assertThat(savedItem.getRegion())
                    .hasValueSatisfying(
                            region -> assertThat(region.getId()).isEqualTo(request.regionId()));
            assertThat(savedItem.getDescription()).hasValue(request.description());
            assertThat(savedItem.getWouldRepeat()).isNull();
        }

        @Test
        void shouldCreateBucketListItemWithCity() throws Exception {
            int cityId = cityRepo.findAll().getFirst().getId();
            var request = new CreateBucketListItemRequest("Kayaking", cityId, null, null);

            var savedItem = bucketListItemRepo.findById(createItem(request)).orElseThrow();

            assertThat(savedItem.getName()).isEqualTo(request.name());
            assertThat(savedItem.getCity())
                    .hasValueSatisfying(
                            city -> assertThat(city.getId()).isEqualTo(request.cityId()));
            assertThat(savedItem.getRegion()).isEmpty();
            assertThat(savedItem.getDescription()).isEmpty();
        }

        @Test
        void shouldCreateBucketListItemAtTextLengthLimitsWithoutLocation() throws Exception {
            var request =
                    new CreateBucketListItemRequest("N".repeat(256), null, null, "D".repeat(4096));

            var savedItem = bucketListItemRepo.findById(createItem(request)).orElseThrow();

            assertThat(savedItem.getName()).hasSize(256);
            assertThat(savedItem.getCity()).isEmpty();
            assertThat(savedItem.getRegion()).isEmpty();
            assertThat(savedItem.getDescription())
                    .hasValueSatisfying(description -> assertThat(description).hasSize(4096));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = "   ")
        void shouldRejectMissingBucketListItemName(String name) throws Exception {
            var request = new CreateBucketListItemRequest(name, null, null, null);

            mockMvc.perform(
                            post("/bucket-list/items")
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));

            assertThat(bucketListItemRepo.count()).isEqualTo(3);
        }

        @Test
        void shouldRejectBucketListItemNameAboveLengthLimit() throws Exception {
            var request = new CreateBucketListItemRequest("N".repeat(257), null, null, null);

            mockMvc.perform(
                            post("/bucket-list/items")
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldRejectBucketListItemDescriptionAboveLengthLimit() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", null, null, "D".repeat(4097));

            mockMvc.perform(
                            post("/bucket-list/items")
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldRejectCityAndRegionAtTheSameTime() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", 1, 1, null);

            mockMvc.perform(
                            post("/bucket-list/items")
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldReturnNotFoundForUnknownCity() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", (int) UNKNOWN_ID, null, null);

            mockMvc.perform(
                            post("/bucket-list/items")
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        @Test
        void shouldReturnNotFoundForUnknownRegion() throws Exception {
            var request = new CreateBucketListItemRequest("Zorbing", null, (int) UNKNOWN_ID, null);

            mockMvc.perform(
                            post("/bucket-list/items")
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        private long createItem(CreateBucketListItemRequest request) throws Exception {
            var response =
                    mockMvc.perform(
                                    post("/bucket-list/items")
                                            .header("x-api-version", "1")
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(mapper.writeValueAsString(request)))
                            .andExpect(status().isCreated())
                            .andExpect(header().exists(HttpHeaders.LOCATION))
                            .andReturn()
                            .getResponse();

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

            mockMvc.perform(
                            put("/bucket-list/items/{id}/name", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNoContent());
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

            mockMvc.perform(
                            put("/bucket-list/items/{id}/name", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));

            assertThat(
                            bucketListItemRepo
                                    .findById(FIRST_BUCKET_LIST_ITEM_ID)
                                    .orElseThrow()
                                    .getName())
                    .isEqualTo("First item");
        }

        @Test
        void shouldRejectBucketListItemNameAboveLengthLimit() throws Exception {
            var updateRequest = new UpdateBucketListItemNameRequest("N".repeat(257));

            mockMvc.perform(
                            put("/bucket-list/items/{id}/name", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingNameOfUnknownItem() throws Exception {
            var updateRequest = new UpdateBucketListItemNameRequest("Paragliding");

            mockMvc.perform(
                            put("/bucket-list/items/{id}/name", UNKNOWN_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }
    }

    @Nested
    class UpdateItemLocationTests {
        @Test
        void shouldUpdateBucketListItemLocationToCity() throws Exception {
            var originalItem =
                    bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();
            var originalName = originalItem.getName();
            var originalDescription = originalItem.getDescription();
            int cityId = cityRepo.findAll().getFirst().getId();
            var updateRequest = new UpdateBucketListItemLocationRequest(cityId, null);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getCity())
                    .hasValueSatisfying(city -> assertThat(city.getId()).isEqualTo(cityId));
            assertThat(updatedItem.getRegion()).isEmpty();
            assertThat(updatedItem.getName()).isEqualTo(originalName);
            assertThat(updatedItem.getDescription()).isEqualTo(originalDescription);
        }

        @Test
        void shouldUpdateBucketListItemLocationToRegion() throws Exception {
            int regionId = regionRepo.findAll().getFirst().getId();
            var updateRequest = new UpdateBucketListItemLocationRequest(null, regionId);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getCity()).isEmpty();
            assertThat(updatedItem.getRegion())
                    .hasValueSatisfying(region -> assertThat(region.getId()).isEqualTo(regionId));
        }

        @Test
        void shouldClearBucketListItemLocation() throws Exception {
            var item = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();
            item.setCity(cityRepo.findAll().getFirst());
            bucketListItemRepo.saveAndFlush(item);
            var updateRequest = new UpdateBucketListItemLocationRequest(null, null);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNoContent());
            var updatedItem = bucketListItemRepo.findById(SECOND_BUCKET_LIST_ITEM_ID).orElseThrow();

            assertThat(updatedItem.getCity()).isEmpty();
            assertThat(updatedItem.getRegion()).isEmpty();
        }

        @Test
        void shouldRejectCityAndRegionAtTheSameTime() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest(1, 1);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingLocationToUnknownCity() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest((int) UNKNOWN_ID, null);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingLocationToUnknownRegion() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest(null, (int) UNKNOWN_ID);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", SECOND_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingLocationOfUnknownItem() throws Exception {
            var updateRequest = new UpdateBucketListItemLocationRequest(null, null);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/location", UNKNOWN_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
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

            mockMvc.perform(
                            put("/bucket-list/items/{id}/description", THIRD_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNoContent());
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

            mockMvc.perform(
                            put("/bucket-list/items/{id}/description", THIRD_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNoContent());

            assertThat(
                            bucketListItemRepo
                                    .findById(THIRD_BUCKET_LIST_ITEM_ID)
                                    .orElseThrow()
                                    .getDescription())
                    .isEmpty();
        }

        @Test
        void shouldRejectBucketListItemDescriptionAboveLengthLimit() throws Exception {
            var updateRequest = new UpdateBucketListItemDescriptionRequest("D".repeat(4097));

            mockMvc.perform(
                            put("/bucket-list/items/{id}/description", THIRD_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingDescriptionOfUnknownItem() throws Exception {
            var updateRequest = new UpdateBucketListItemDescriptionRequest("Description");

            mockMvc.perform(
                            put("/bucket-list/items/{id}/description", UNKNOWN_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }
    }

    @Nested
    class UpdateItemCompletionTests {
        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        void shouldCompleteBucketListItemOnFirstTripDay(Boolean wouldRepeat) throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request =
                new UpdateBucketListItemCompletionRequest(
                    trip.getFrom(), trip.getId(), wouldRepeat);

            updateCompletion(FIRST_BUCKET_LIST_ITEM_ID, request);

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getCompletedOn()).isEqualTo(trip.getFrom());
            assertThat(updatedItem.getTrip())
                .hasValueSatisfying(savedTrip -> assertThat(savedTrip.getId()).isEqualTo(trip.getId()));
            assertThat(updatedItem.getWouldRepeat()).isEqualTo(wouldRepeat);
        }

        @Test
        void shouldCompleteBucketListItemOnLastTripDay() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = mapper.createObjectNode()
                .put("completedOn", trip.getTo().toString())
                .put("tripId", trip.getId())
                .put("wouldRepeat", false);

            mockMvc.perform(
                    put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                        .header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getCompletedOn()).isEqualTo(trip.getTo());
            assertThat(updatedItem.getTrip())
                .hasValueSatisfying(savedTrip -> assertThat(savedTrip.getId()).isEqualTo(trip.getId()));
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

            updateCompletion(
                FIRST_BUCKET_LIST_ITEM_ID,
                new UpdateBucketListItemCompletionRequest(
                    trip.getFrom(), trip.getId(), wouldRepeat));

            var updatedItem = bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID).orElseThrow();
            assertThat(updatedItem.getWouldRepeat()).isEqualTo(wouldRepeat);
            assertThat(updatedItem.getCompletedOn()).isEqualTo(trip.getFrom());
            assertThat(updatedItem.getTrip())
                .hasValueSatisfying(savedTrip -> assertThat(savedTrip.getId()).isEqualTo(trip.getId()));
        }

        @Test
        void shouldRejectCompletionWithNullRepeatPreference() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(
                    trip.getFrom(), trip.getId(), null);

            mockMvc.perform(
                    put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                        .header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

            @Test
            void shouldRejectCompletionWithoutRepeatPreference() throws Exception {
                var trip = tripRepo.findAll().getFirst();
                var request = new UpdateBucketListItemCompletionRequest(
                    trip.getFrom(), trip.getId(), null);
                var requestJson = mapper.copy()
                    .setSerializationInclusion(JsonInclude.Include.NON_NULL)
                    .writeValueAsString(request);

                mockMvc.perform(
                    put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                    .header("x-api-version", "1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));

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
            mockMvc.perform(
                    get("/bucket-list/items/{id}", FIRST_BUCKET_LIST_ITEM_ID)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wouldRepeat").value(nullValue()));
        }

        @Test
        void shouldRejectCompletionDateWithoutTrip() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), null, false);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldRejectTripWithoutCompletionDate() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(null, trip.getId(), false);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldRejectCompletionDateBeforeTrip() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request =
                    new UpdateBucketListItemCompletionRequest(
                        trip.getFrom().minusDays(1), trip.getId(), false);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldRejectCompletionDateAfterTrip() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request =
                    new UpdateBucketListItemCompletionRequest(
                        trip.getTo().plusDays(1), trip.getId(), false);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
        }

        @Test
        void shouldReturnNotFoundForUnknownTrip() throws Exception {
            var request =
                    new UpdateBucketListItemCompletionRequest(
                        java.time.LocalDate.now(), UNKNOWN_ID, false);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        @Test
        void shouldReturnNotFoundWhenUpdatingCompletionOfUnknownItem() throws Exception {
            var trip = tripRepo.findAll().getFirst();
            var request = new UpdateBucketListItemCompletionRequest(trip.getFrom(), trip.getId(), false);

            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", UNKNOWN_ID)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        private void updateCompletion(long itemId, UpdateBucketListItemCompletionRequest request)
                throws Exception {
            mockMvc.perform(
                            put("/bucket-list/items/{id}/completion", itemId)
                                    .header("x-api-version", "1")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(mapper.writeValueAsString(request)))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    class DeleteItemTests {
        @Test
        void shouldDeleteBucketListItem() throws Exception {
            mockMvc.perform(
                            delete("/bucket-list/items/{id}", FIRST_BUCKET_LIST_ITEM_ID)
                                    .header("x-api-version", "1"))
                    .andExpect(status().isNoContent());

            assertThat(bucketListItemRepo.findById(FIRST_BUCKET_LIST_ITEM_ID)).isEmpty();
        }

        @Test
        void shouldReturnNotFoundWhenDeletingUnknownItem() throws Exception {
            mockMvc.perform(
                            delete("/bucket-list/items/{id}", UNKNOWN_ID)
                                    .header("x-api-version", "1"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }
    }

    @Nested
    class ListItemsTests {
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

            assertThat(items)
                    .filteredOn(response -> response.id() == FIRST_BUCKET_LIST_ITEM_ID)
                    .singleElement()
                    .extracting(GetBucketListItemResponse::wouldRepeat)
                    .isEqualTo(wouldRepeat);
        }

        @Test
        void shouldReturnItemsInPagesInDescendingOrderByDefault() throws Exception {
            var firstPage = getItems(null, null, null);

            assertThat(firstPage).hasSize(2);
            assertThat(firstPage)
                    .extracting(GetBucketListItemResponse::name)
                    .containsExactly("Third item", "Second item");

            var secondPage = getItems(null, firstPage[1].id(), firstPage[1].changedOn().toString());
            assertThat(secondPage)
                    .extracting(GetBucketListItemResponse::name)
                    .containsExactly("First item");

            var pageAfterLastItem =
                    getItems(null, secondPage[0].id(), secondPage[0].changedOn().toString());
            assertThat(pageAfterLastItem).isEmpty();
        }

        @Test
        void shouldReturnItemsInPagesInAscendingOrder() throws Exception {
            var firstPage = getItems("ASC", null, null);

            assertThat(firstPage).hasSize(2);
            assertThat(firstPage)
                    .extracting(GetBucketListItemResponse::name)
                    .containsExactly("First item", "Second item");

            var secondPage =
                    getItems("ASC", firstPage[1].id(), firstPage[1].changedOn().toString());
            assertThat(secondPage)
                    .extracting(GetBucketListItemResponse::name)
                    .containsExactly("Third item");

            var pageAfterLastItem =
                    getItems("ASC", secondPage[0].id(), secondPage[0].changedOn().toString());
            assertThat(pageAfterLastItem).isEmpty();
        }

        @Test
        void shouldReturnEmptyListWhenNoBucketListItemsExist() throws Exception {
            bucketListItemRepo.deleteAll();

            assertThat(getItems(null, null, null)).isEmpty();
        }

        private GetBucketListItemResponse[] getItems(
                String sortDirection, Long itemId, String updatedOn) throws Exception {
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

            var json =
                    mockMvc.perform(request)
                            .andExpect(status().isOk())
                            .andReturn()
                            .getResponse()
                            .getContentAsString();
            return mapper.readValue(json, GetBucketListItemResponse[].class);
        }
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
        void shouldReturnRegionDescriptionTripCompletionAndRepeatPreference(Boolean wouldRepeat)
                throws Exception {
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
            assertThat(response.changedOn()).isEqualTo(item.getUpdatedOn().orElseThrow());
        }

        @Test
        void shouldReturnNotFoundForUnknownBucketListItem() throws Exception {
            mockMvc.perform(get("/bucket-list/items/{id}", UNKNOWN_ID).header("x-api-version", "1"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"));
        }

        private GetBucketListItemResponse getItem(long itemId) throws Exception {
            var json =
                    mockMvc.perform(
                                    get("/bucket-list/items/{id}", itemId)
                                            .header("x-api-version", "1"))
                            .andExpect(status().isOk())
                            .andReturn()
                            .getResponse()
                            .getContentAsString();
            return mapper.readValue(json, GetBucketListItemResponse.class);
        }
    }
}
