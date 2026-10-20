package com.triptrove.manager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.controller.*;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.domain.service.*;
import com.triptrove.manager.infra.GlobalExceptionHandler;
import com.triptrove.manager.infra.ManagerProperties;
import jakarta.persistence.EntityManager;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.Validator;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.IntFunction;
import java.util.stream.LongStream;
import java.util.stream.Stream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

final class KeysetTestFixtures {
    static final String CHANGED_ON = "2026-09-28T12:00:00.123456";
    // Even rows were edited and odd rows never were, but every row's
    // effective time, coalesce(updated_on, created_on), is CHANGED_ON.
    private static final String CREATED_AND_UPDATED_ON = """
            CASE WHEN mod(id, 2) = 0 THEN TIMESTAMP '2026-09-01 00:00:00'
                 ELSE TIMESTAMP '2026-09-28 12:00:00.123456' END,
            CASE WHEN mod(id, 2) = 0 THEN TIMESTAMP '2026-09-28 12:00:00.123456' END""";
    private static final Map<String, List<String>> LONG_IDENTIFIER_STATEMENTS = Map.of(
            "attraction", List.of("UPDATE attraction SET id = id + 2147483646 WHERE id < 1000000"),
            "bucket_list_item", List.of("UPDATE bucket_list_item SET id = id + 2147483646"),
            "trip", List.of(
                    "DELETE FROM trip_attraction",
                    "UPDATE trip SET id = id + 2147483646",
                    """
                    INSERT INTO trip_attraction(id, trip_id, attraction_id, created_on, status,
                        attraction_group, board_position, must_visit, would_visit_again)
                    SELECT id - 2147483646, id, id - 2147483646, TIMESTAMP '2026-09-28 12:00:00',
                           'VISITED', 'PRIMARY', 1, true, false FROM trip
                    """));
    private static final ObjectMapper mapper = new ObjectMapper();

    private KeysetTestFixtures() {
    }

    record Workflow(
            String path, String cursorField, String responseField, String table,
            Map<String, String> parameters, BiConsumer<EntityManager, Integer> fixture,
            IntFunction<List<Long>> identifiers) {
        MockHttpServletRequestBuilder request() {
            var request = get(path);
            parameters.forEach((name, value) -> request.param(name, value));
            return request;
        }

        Workflow withParameters(Map<String, String> replacement) {
            return new Workflow(path, cursorField, responseField, table, replacement, fixture, identifiers);
        }

        @Override
        public String toString() {
            return path + " " + parameters;
        }
    }

    record CursorRoute(String path, String idField, String idType) {
    }

    static Stream<Workflow> workflows() {
        return Stream.concat(listWorkflows(), searchWorkflows());
    }

    static Stream<Workflow> listWorkflows() {
        return Stream.of(
                directions("/countries", "countryId", "countryId", "country", Map.of(),
                        KeysetTestFixtures::countries, KeysetTestFixtures::sequentialIds),
                directions("/regions", "regionId", "regionId", "region", Map.of(),
                        KeysetTestFixtures::regions, KeysetTestFixtures::sequentialIds),
                directions("/cities", "cityId", "cityId", "city", Map.of(),
                        KeysetTestFixtures::cities, KeysetTestFixtures::sequentialIds),
                directions("/attractions", "attractionId", "attractionId", "attraction", Map.of(),
                        KeysetTestFixtures::attractions, KeysetTestFixtures::sequentialIds),
                directions("/trips", "tripId", "tripId", "trip", Map.of(),
                        KeysetTestFixtures::tripsWithAttractions, KeysetTestFixtures::sequentialIds),
                directions("/bucket-list/items", "itemId", "id", "bucket_list_item", Map.of(),
                        KeysetTestFixtures::bucketItems, KeysetTestFixtures::sequentialIds),
                directions("/bucket-list/items", "itemId", "id", "bucket_list_item", Map.of("status", "TODO"),
                        KeysetTestFixtures::mixedBucketItems, KeysetTestFixtures::oddIds),
                directions("/bucket-list/items", "itemId", "id", "bucket_list_item", Map.of("status", "COMPLETED"),
                        KeysetTestFixtures::mixedBucketItems, KeysetTestFixtures::evenIds))
                .flatMap(stream -> stream);
    }

    static Stream<Workflow> searchWorkflows() {
        return Stream.of(
                search("/search/continent/Keyset continent/attractions", KeysetTestFixtures::attractions),
                search("/search/country/1/attractions", KeysetTestFixtures::attractions),
                search("/search/region/1/attractions", KeysetTestFixtures::regionAttractions),
                search("/search/city/1/attractions", KeysetTestFixtures::cityAttractions),
                search("/search/attraction/1000000/attractions", KeysetTestFixtures::childAttractions));
    }

    // Long-identifier scenarios use the unfiltered three-row fixture.
    static Stream<Workflow> longIdentifierWorkflows(Stream<Workflow> workflows) {
        return workflows
                .filter(workflow -> LONG_IDENTIFIER_STATEMENTS.containsKey(workflow.table()))
                .filter(workflow -> !workflow.parameters().containsKey("status"));
    }

    static Stream<CursorRoute> cursorRoutes() {
        return Stream.of(
                new CursorRoute("/countries", "countryId", "Integer"),
                new CursorRoute("/regions", "regionId", "Integer"),
                new CursorRoute("/cities", "cityId", "Integer"),
                new CursorRoute("/attractions", "attractionId", "Long"),
                new CursorRoute("/bucket-list/items", "itemId", "Long"),
                new CursorRoute("/trips", "tripId", "Long"),
                new CursorRoute("/search/continent/Test continent 0/attractions", "attractionId", "Long"),
                new CursorRoute("/search/country/1/attractions", "attractionId", "Long"),
                new CursorRoute("/search/region/1/attractions", "attractionId", "Long"),
                new CursorRoute("/search/city/1/attractions", "attractionId", "Long"),
                new CursorRoute("/search/attraction/1/attractions", "attractionId", "Long"));
    }

    private static Workflow search(String path, BiConsumer<EntityManager, Integer> fixture) {
        return new Workflow(path, "attractionId", "attractionId", "attraction", Map.of(),
                fixture, size -> sequentialIds(size).reversed());
    }

    private static Stream<Workflow> directions(
            String path, String cursorField, String responseField, String table,
            Map<String, String> filters, BiConsumer<EntityManager, Integer> fixture,
            IntFunction<List<Long>> identifiers) {
        var ascending = new java.util.HashMap<>(filters);
        ascending.put("sd", "ASC");
        var descending = new java.util.HashMap<>(filters);
        descending.put("sd", "DESC");
        return Stream.of(
                new Workflow(path, cursorField, responseField, table, Map.copyOf(ascending),
                        fixture, identifiers),
                new Workflow(path, cursorField, responseField, table, Map.copyOf(descending),
                        fixture, size -> identifiers.apply(size).reversed()));
    }

    static MockMvc mockMvc(WebApplicationContext context, int pageSize) {
        var properties = new ManagerProperties(pageSize, 1, 195);
        var countryRepo = context.getBean(CountryRepo.class);
        var regionRepo = context.getBean(RegionRepo.class);
        var cityRepo = context.getBean(CityRepo.class);
        var attractionRepo = context.getBean(AttractionRepo.class);
        var tripRepo = context.getBean(TripRepo.class);
        var tripAttractionRepo = context.getBean(TripAttractionRepo.class);
        var continentRepo = context.getBean(ContinentRepo.class);
        var informationProviderRepo = context.getBean(InformationProviderRepo.class);
        return MockMvcBuilders.standaloneSetup(
                        new CountryController(new CountryServiceImpl(countryRepo, continentRepo, properties)),
                        new RegionController(new RegionServiceImpl(properties, regionRepo, countryRepo)),
                        new CityController(new CityServiceImpl(properties, cityRepo, regionRepo)),
                        new AttractionController(new AttractionServiceImpl(
                                properties, regionRepo, cityRepo, attractionRepo, informationProviderRepo)),
                        new TripController(new TripServiceImpl(properties, tripRepo, attractionRepo, tripAttractionRepo)),
                        new BucketListController(new BucketListServiceImpl(
                                properties, context.getBean(BucketListItemRepo.class), cityRepo, regionRepo, tripRepo)),
                        new SearchController(new SearchServiceImpl(properties, continentRepo, countryRepo,
                                regionRepo, cityRepo, attractionRepo, informationProviderRepo, tripAttractionRepo)))
                .setControllerAdvice(context.getBean(GlobalExceptionHandler.class))
                .setValidator(context.getBean("mvcValidator", Validator.class))
                .setMessageConverters(context.getBean(RequestMappingHandlerAdapter.class)
                        .getMessageConverters().toArray(HttpMessageConverter<?>[]::new))
                .build();
    }

    static JsonNode readPage(MockMvc mockMvc, MockHttpServletRequestBuilder request) throws Exception {
        var response = mockMvc.perform(request.header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response);
    }

    static MockHttpServletRequestBuilder nextPageRequest(Workflow workflow, JsonNode page) {
        var anchor = page.get(page.size() - 1);
        return workflow.request()
                .param(workflow.cursorField(), anchor.path(workflow.responseField()).asText())
                .param("updatedOn", anchor.path("changedOn").asText());
    }

    static void deleteAnchor(EntityManager entityManager, Workflow workflow, long anchor) {
        var dependentDeletes = Map.of("trip", List.of("DELETE FROM trip_attraction WHERE trip_id = :anchor"));
        for (var statement : dependentDeletes.getOrDefault(workflow.table(), List.of())) {
            entityManager.createNativeQuery(statement).setParameter("anchor", anchor).executeUpdate();
        }
        entityManager.createNativeQuery("DELETE FROM " + workflow.table() + " WHERE id = :anchor")
                .setParameter("anchor", anchor).executeUpdate();
    }

    static void useLongIdentifiers(EntityManager entityManager, Workflow workflow) {
        for (var statement : LONG_IDENTIFIER_STATEMENTS.get(workflow.table())) {
            entityManager.createNativeQuery(statement).executeUpdate();
        }
    }

    static void prepareFilteredSearch(EntityManager entityManager, Workflow workflow) {
        clear(entityManager);
        workflow.fixture().accept(entityManager, 6);
        trips(entityManager, 6);
        visitedAttractions(entityManager, 6);
        entityManager.createNativeQuery("""
                UPDATE attraction SET must_visit = false, is_traditional = false,
                    category = 'ART_MUSEUM', type = 'POTENTIAL_CHANGE' WHERE id IN (2, 4, 6)
                """).executeUpdate();
        entityManager.createNativeQuery("UPDATE attraction SET name = 'Needle first' WHERE id = 1").executeUpdate();
        entityManager.createNativeQuery("UPDATE attraction SET tip = 'Needle third' WHERE id = 3").executeUpdate();
        entityManager.createNativeQuery("UPDATE information_provider SET name = 'Needle provider' WHERE id = 5").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM trip_attraction WHERE attraction_id = 1").executeUpdate();
        entityManager.createNativeQuery("UPDATE trip_attraction SET would_visit_again = true WHERE attraction_id = 3").executeUpdate();
    }

    static MockHttpServletRequestBuilder filteredSearchRequest(Workflow workflow) {
        return workflow.request().param("mustVisit", "true").param("isTraditional", "true")
                .param("isCountrywide", "false").param("category", "HISTORIC_SITE")
                .param("type", "STABLE").param("q", "Needle");
    }

    static void populateAttractionDetails(EntityManager entityManager) {
        entityManager.createNativeQuery("""
                UPDATE attraction
                SET city_id = 1, address = 'Full details address', latitude = 10, longitude = 20,
                    tip = 'Full details tip', visit_period_from = '2026-04-01', visit_period_to = '2026-10-01'
                WHERE id = 5
                """).executeUpdate();
    }

    static void populateTripBoardDetails(EntityManager entityManager) {
        entityManager.createNativeQuery("""
                UPDATE trip_attraction
                SET attraction_id = 5, working_hours = '09:00-17:00', visit_time = '1 hour',
                    review_note = 'Worth returning', would_visit_again = true
                WHERE id = 3
                """).executeUpdate();
    }

    static void populateBucketListDetails(EntityManager entityManager) {
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
    }

    static void linkBucketListItemsToRegionsAndTrips(EntityManager entityManager) {
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET completed_on = (SELECT trip_end_date FROM trip WHERE trip.id = bucket_list_item.id),
                    would_repeat = false, region_id = id, trip_id = id
                """).executeUpdate();
    }

    static void prepareMixedBucketListItems(EntityManager entityManager) {
        entityManager.createNativeQuery("""
                UPDATE bucket_list_item
                SET completed_on = (SELECT trip_start_date FROM trip WHERE trip.id = bucket_list_item.id),
                    would_repeat = false,
                    city_id = CASE WHEN id = 1 THEN 1 END,
                    region_id = CASE WHEN id = 2 THEN 2 END,
                    trip_id = id
                WHERE id IN (1, 2)
                """).executeUpdate();
    }

    static void insertMixedBucketListDataset(EntityManager entityManager, int generatedSize) {
        entityManager.createNativeQuery("""
                INSERT INTO bucket_list_item(
                    created_on, updated_on, name, completed_on, would_repeat,
                    city_id, region_id, trip_id, description)
                SELECT TIMESTAMP '2026-01-01 00:00:00' + generated.id * INTERVAL '1 microsecond',
                       null,
                       'Repeated generated experience',
                       CASE WHEN mod(generated.id, 2) = 0
                            THEN (SELECT trip_start_date FROM trip WHERE trip.id = mod(generated.id, 3) + 1)
                       END,
                       CASE WHEN mod(generated.id, 2) = 0 THEN false END,
                       CASE WHEN mod(generated.id, 6) < 3 THEN mod(generated.id, 3) + 1 END,
                       CASE WHEN mod(generated.id, 6) >= 3 THEN mod(generated.id, 3) + 1 END,
                       CASE WHEN mod(generated.id, 2) = 0 THEN mod(generated.id, 3) + 1 END,
                       CASE WHEN mod(generated.id, 4) = 0 THEN 'Populated optional description' END
                FROM generate_series(1, :generatedSize) AS generated(id)
                """).setParameter("generatedSize", generatedSize).executeUpdate();
    }

    private static List<Long> sequentialIds(int size) {
        return LongStream.rangeClosed(1, size).boxed().toList();
    }

    private static List<Long> oddIds(int size) {
        return LongStream.range(0, size).map(index -> index * 2 + 1).boxed().toList();
    }

    private static List<Long> evenIds(int size) {
        return LongStream.rangeClosed(1, size).map(index -> index * 2).boxed().toList();
    }

    static void clear(EntityManager entityManager) {
        for (var statement : List.of(
                "DELETE FROM bucket_list_item", "DELETE FROM trip_attraction", "DELETE FROM trip",
                "UPDATE attraction SET main_attraction_id = null", "DELETE FROM attraction",
                "DELETE FROM city", "DELETE FROM region", "DELETE FROM country",
                "DELETE FROM continent", "DELETE FROM information_provider")) {
            entityManager.createNativeQuery(statement).executeUpdate();
        }
        entityManager.clear();
    }

    private static void countries(EntityManager entityManager, int size) {
        entityManager.createNativeQuery("""
                INSERT INTO continent(id, name, created_on)
                SELECT id, 'Keyset continent ' || id, TIMESTAMP '2026-09-01 00:00:00'
                FROM generate_series(1, :size) AS generated(id)
                """).setParameter("size", size).executeUpdate();
        entityManager.createNativeQuery("""
                INSERT INTO country(id, name, continent_id, iso_code, created_on, updated_on)
                SELECT id, 'Keyset country ' || id, id,
                       chr(97 + (id - 1) / 26) || chr(97 + mod(id - 1, 26)),
                       %s
                FROM generate_series(1, :size) AS generated(id)
                """.formatted(CREATED_AND_UPDATED_ON)).setParameter("size", size).executeUpdate();
    }

    private static void regions(EntityManager entityManager, int size) {
        countries(entityManager, size);
        insertRegions(entityManager, size, "generated.id");
    }

    private static void insertRegions(EntityManager entityManager, int size, String country) {
        entityManager.createNativeQuery("""
                INSERT INTO region(id, name, country_id, created_on, updated_on)
                SELECT id, 'Keyset region ' || id, %s,
                       %s
                FROM generate_series(1, :size) AS generated(id)
                """.formatted(country, CREATED_AND_UPDATED_ON)).setParameter("size", size).executeUpdate();
    }

    private static void cities(EntityManager entityManager, int size) {
        regions(entityManager, size);
        insertCities(entityManager, size);
    }

    private static void insertCities(EntityManager entityManager, int size) {
        entityManager.createNativeQuery("""
                INSERT INTO city(id, name, region_id, created_on, updated_on)
                SELECT id, 'Keyset city ' || id, id,
                       %s
                FROM generate_series(1, :size) AS generated(id)
                """.formatted(CREATED_AND_UPDATED_ON)).setParameter("size", size).executeUpdate();
    }

    static void attractionParents(EntityManager entityManager, int size) {
        entityManager.createNativeQuery("""
                INSERT INTO continent(id, name, created_on)
                VALUES (1, 'Keyset continent', TIMESTAMP '2026-09-01 00:00:00')
                """).executeUpdate();
        entityManager.createNativeQuery("""
                INSERT INTO country(id, name, continent_id, iso_code, created_on)
                VALUES (1, 'Keyset country', 1, 'aa', TIMESTAMP '2026-09-01 00:00:00')
                """).executeUpdate();
        var parentSize = Math.max(1, size);
        insertRegions(entityManager, parentSize, "1");
        insertCities(entityManager, parentSize);
        entityManager.createNativeQuery("""
                INSERT INTO information_provider(id, name, created_on)
                SELECT id, 'Keyset provider ' || id, TIMESTAMP '2026-09-01 00:00:00'
                FROM generate_series(1, :size) AS generated(id)
                """).setParameter("size", parentSize).executeUpdate();
    }

    private static void attractions(EntityManager entityManager, int size) {
        attractionParents(entityManager, size);
        insertAttractions(entityManager, size, "generated.id", "generated.id", "null");
    }

    private static void regionAttractions(EntityManager entityManager, int size) {
        attractionParents(entityManager, size);
        insertAttractions(entityManager, size, "1", "null", "null");
    }

    private static void cityAttractions(EntityManager entityManager, int size) {
        attractionParents(entityManager, size);
        insertAttractions(entityManager, size, "1", "1", "null");
    }

    private static void childAttractions(EntityManager entityManager, int size) {
        attractionParents(entityManager, size);
        entityManager.createNativeQuery("""
                INSERT INTO attraction(id, name, country_id, region_id, created_on, category, type,
                    is_countrywide, is_traditional, must_visit, information_provider_id, source_date)
                VALUES (1000000, 'Keyset parent attraction', 1, 1, TIMESTAMP '2026-09-01 00:00:00',
                    'HISTORIC_SITE', 'STABLE', false, false, false, 1, DATE '2026-09-01')
                """).executeUpdate();
        insertAttractions(entityManager, size, "generated.id", "generated.id", "1000000");
    }

    private static void insertAttractions(
            EntityManager entityManager, int size, String region, String city, String main) {
        entityManager.createNativeQuery("""
                INSERT INTO attraction(id, name, country_id, region_id, city_id, main_attraction_id,
                    created_on, updated_on, category, type, is_countrywide, is_traditional,
                    must_visit, information_provider_id, source_date, address, latitude, longitude,
                    tip, visit_period_from, visit_period_to)
                SELECT id, 'Keyset attraction ' || id, 1, %s, %s, %s,
                       %s,
                       'HISTORIC_SITE', 'STABLE', false, true, true, id, DATE '2026-09-01',
                       CASE WHEN mod(id, 2) = 0 THEN 'Populated address' END,
                       CASE WHEN mod(id, 2) = 0 THEN 10 END,
                       CASE WHEN mod(id, 2) = 0 THEN 20 END,
                       CASE WHEN mod(id, 2) = 0 THEN 'Populated tip' END,
                       CASE WHEN mod(id, 2) = 0 THEN DATE '2026-04-01' END,
                       CASE WHEN mod(id, 2) = 0 THEN DATE '2026-10-01' END
                FROM generate_series(1, :size) AS generated(id)
                """.formatted(region, city, main, CREATED_AND_UPDATED_ON)).setParameter("size", size).executeUpdate();
    }

    static void trips(EntityManager entityManager, int size) {
        entityManager.createNativeQuery("""
                INSERT INTO trip(id, name, trip_start_date, trip_end_date, archived, created_on, updated_on)
                SELECT id, 'Repeated trip', DATE '2026-09-01', DATE '2026-09-30', mod(id, 2) = 0,
                       %s
                FROM generate_series(1, :size) AS generated(id)
                """.formatted(CREATED_AND_UPDATED_ON)).setParameter("size", size).executeUpdate();
    }

    private static void tripsWithAttractions(EntityManager entityManager, int size) {
        attractions(entityManager, size);
        trips(entityManager, size);
        visitedAttractions(entityManager, size);
    }

    static void visitedAttractions(EntityManager entityManager, int size) {
        entityManager.createNativeQuery("""
                INSERT INTO trip_attraction(id, trip_id, attraction_id, created_on, status,
                    attraction_group, board_position, must_visit, would_visit_again, review_note)
                SELECT id, id, id, TIMESTAMP '2026-09-28 12:00:00', 'VISITED',
                       'PRIMARY', 1, true, mod(id, 2) = 0, 'Populated review'
                FROM generate_series(1, :size) AS generated(id)
                """).setParameter("size", size).executeUpdate();
    }

    private static void mixedBucketItems(EntityManager entityManager, int matchingSize) {
        bucketItems(entityManager, matchingSize * 2);
    }

    private static void bucketItems(EntityManager entityManager, int size) {
        attractionParents(entityManager, size);
        trips(entityManager, size);
        entityManager.createNativeQuery("""
                INSERT INTO bucket_list_item(id, name, created_on, updated_on, completed_on, would_repeat,
                    city_id, region_id, trip_id, description)
                SELECT id, 'Repeated Bucket item',
                       %s,
                       CASE WHEN mod(id, 2) = 0 THEN DATE '2026-09-28' END,
                       CASE WHEN mod(id, 2) = 0 THEN true END,
                       CASE WHEN mod(id, 2) = 1 THEN id END,
                       CASE WHEN mod(id, 2) = 0 THEN id END,
                       CASE WHEN mod(id, 2) = 0 THEN id END,
                       CASE WHEN mod(id, 2) = 0 THEN 'Populated description' END
                FROM generate_series(1, :size) AS generated(id)
                """.formatted(CREATED_AND_UPDATED_ON)).setParameter("size", size).executeUpdate();
    }
}
