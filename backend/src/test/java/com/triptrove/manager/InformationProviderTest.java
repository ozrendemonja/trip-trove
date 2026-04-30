package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.triptrove.manager.application.dto.AttractionCategoryDTO;
import com.triptrove.manager.application.dto.AttractionTypeDTO;
import com.triptrove.manager.application.dto.SaveAttractionRequest;
import com.triptrove.manager.application.dto.UpdateAttractionInformationProviderRequest;
import com.triptrove.manager.application.dto.error.ErrorCodeResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.InformationProvider;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.InformationProviderRepo;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Functional tests for the {@link InformationProvider} autocomplete
 * functionality:
 * <ul>
 *     <li>{@code GET /search?i=INFORMATION_PROVIDER} suggestion endpoint</li>
 *     <li>find-or-create behaviour when saving an attraction</li>
 *     <li>find-or-create behaviour when updating an attraction's
 *         information provider</li>
 * </ul>
 *
 * Test data (see {@code attractions-test-data.sql}) seeds three providers:
 * <pre>
 *   id=1 'Functional Test'   (created 2024-08-20)
 *   id=2 'Functional Test 2' (created 2024-08-23)
 *   id=3 'Functional Test 3' (created 2025-01-10)
 * </pre>
 * Suggestion ordering is {@code coalesce(updatedOn, createdOn) DESC} and the
 * test profile limits suggestions to 3
 * ({@code manager.request.suggestion-limit=3}).
 */
@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class InformationProviderTest extends AbstractIntegrationTest {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InformationProviderRepo informationProviderRepo;

    @Autowired
    private AttractionRepo attractionRepo;

    @BeforeAll
    static void setupAll() {
        mapper.registerModule(new JavaTimeModule());
    }

    // ---------------------------------------------------------------------
    // Suggestion endpoint
    // ---------------------------------------------------------------------

    @ParameterizedTest
    @MethodSource("provideValidInformationProviderQueries")
    void shouldReturnSortedInformationProviderSuggestionsForGivenQuery(QueryAndSuggestions input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "INFORMATION_PROVIDER")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input.query());
        assertThat(response.suggestions()).containsExactlyElementsOf(input.suggestedNames());
    }

    private static Stream<QueryAndSuggestions> provideValidInformationProviderQueries() {
        // Test profile suggestion-limit = 3, all three providers match common
        // prefixes. Order is newest first (descending createdOn).
        return Stream.of(
                new QueryAndSuggestions("Fun", List.of(
                        suggest("Functional Test 3", 3),
                        suggest("Functional Test 2", 2),
                        suggest("Functional Test", 1))),
                new QueryAndSuggestions("functional", List.of(
                        suggest("Functional Test 3", 3),
                        suggest("Functional Test 2", 2),
                        suggest("Functional Test", 1))),
                new QueryAndSuggestions("Test 2", List.of(
                        suggest("Functional Test 2", 2))),
                new QueryAndSuggestions("Test 3", List.of(
                        suggest("Functional Test 3", 3)))
        );
    }

    @Test
    void shouldReturnEmptySuggestionsWhenNoInformationProviderMatchesQuery() throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "no-match-prefix")
                        .param("i", "INFORMATION_PROVIDER")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo("no-match-prefix");
        assertThat(response.suggestions()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "F", "Fu"})
    void shouldRejectInformationProviderQueriesShorterThanThreeCharacters(String input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "INFORMATION_PROVIDER")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse actual = mapper.readValue(jsonResponse, ErrorResponse.class);
        assertThat(actual.errorCode()).isEqualTo(ErrorCodeResponse.BAD_REQUEST);
    }

    @Test
    void shouldIgnoreCountryIdFilterWhenSearchingInformationProviders() throws Exception {
        // Providers are not scoped to countries; passing cid must not narrow
        // or hide results.
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "Fun")
                        .param("i", "INFORMATION_PROVIDER")
                        .param("cid", "1")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions()).containsExactly(
                suggest("Functional Test 3", 3),
                suggest("Functional Test 2", 2),
                suggest("Functional Test", 1));
    }

    // ---------------------------------------------------------------------
    // Find-or-create on save
    // ---------------------------------------------------------------------

    @Test
    void savingAttractionWithNewProviderNameShouldCreateInformationProviderRow() throws Exception {
        long providersBefore = informationProviderRepo.count();
        String newSourceName = "Brand new test source " + System.nanoTime();

        SaveAttractionRequest request = new SaveAttractionRequest(
                false, 1, null,
                "Attraction with brand new source", null, null, null,
                AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE,
                true, false, null,
                newSourceName, LocalDate.now().minusDays(1), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore + 1);
        InformationProvider created = informationProviderRepo.findBySourceName(newSourceName).orElseThrow();
        assertThat(created.getSourceName()).isEqualTo(newSourceName);

        Long attractionId = attractionRepo.findByName(request.attractionName()).getFirst().getId();
        assertThat(attractionRepo.findById(attractionId)
                .map(Attraction::getInformationProvider)
                .map(InformationProvider::getId))
                .hasValue(created.getId());
    }

    @Test
    void savingAttractionWithExistingProviderNameShouldReuseInformationProviderRow() throws Exception {
        long providersBefore = informationProviderRepo.count();
        String existingSourceName = "Functional Test 2"; // seeded id=2
        Integer existingId = informationProviderRepo.findBySourceName(existingSourceName).orElseThrow().getId();

        SaveAttractionRequest request = new SaveAttractionRequest(
                false, 1, null,
                "Attraction reusing existing source", null, null, null,
                AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE,
                true, false, null,
                existingSourceName, LocalDate.now().minusDays(2), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // No new InformationProvider row should be created.
        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore);

        Long attractionId = attractionRepo.findByName(request.attractionName()).getFirst().getId();
        assertThat(attractionRepo.findById(attractionId)
                .map(Attraction::getInformationProvider)
                .map(InformationProvider::getId))
                .hasValue(existingId);
    }

    // ---------------------------------------------------------------------
    // Find-or-create on update
    // ---------------------------------------------------------------------

    @Test
    void updatingAttractionInformationProviderWithExistingNameShouldReuseRow() throws Exception {
        long providersBefore = informationProviderRepo.count();
        String existingSourceName = "Functional Test 3"; // seeded id=3
        Integer existingId = informationProviderRepo.findBySourceName(existingSourceName).orElseThrow().getId();

        // Attraction id=1 is initially linked to provider 'Functional Test' (id=1).
        UpdateAttractionInformationProviderRequest request =
                new UpdateAttractionInformationProviderRequest(existingSourceName, LocalDate.now().minusDays(5));

        mockMvc.perform(put("/attractions/1/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore);
        assertThat(attractionRepo.findById(1L)
                .map(Attraction::getInformationProvider)
                .map(InformationProvider::getId))
                .hasValue(existingId);
        assertThat(attractionRepo.findById(1L).map(Attraction::getRecorded))
                .hasValue(LocalDate.now().minusDays(5));
    }

    @Test
    void updatingAttractionInformationProviderWithNewNameShouldCreateRow() throws Exception {
        long providersBefore = informationProviderRepo.count();
        String newSourceName = "Updated source " + System.nanoTime();

        UpdateAttractionInformationProviderRequest request =
                new UpdateAttractionInformationProviderRequest(newSourceName, LocalDate.now().minusDays(3));

        mockMvc.perform(put("/attractions/1/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore + 1);
        InformationProvider created = informationProviderRepo.findBySourceName(newSourceName).orElseThrow();
        assertThat(attractionRepo.findById(1L)
                .map(Attraction::getInformationProvider)
                .map(InformationProvider::getId))
                .hasValue(created.getId());
        assertThat(attractionRepo.findById(1L).map(Attraction::getRecorded))
                .hasValue(LocalDate.now().minusDays(3));
    }

    @Test
    void newlyCreatedProviderShouldAppearInSuggestions() throws Exception {
        String newSourceName = "Suggested source " + System.nanoTime();

        SaveAttractionRequest request = new SaveAttractionRequest(
                false, 1, null,
                "Attraction triggering suggestion " + System.nanoTime(), null, null, null,
                AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE,
                true, false, null,
                newSourceName, LocalDate.now().minusDays(4), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", "Suggested")
                        .param("i", "INFORMATION_PROVIDER")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.suggestions()).extracting(SuggestionDto::value).contains(newSourceName);
    }

    // ---------------------------------------------------------------------
    // Orphan cleanup
    // ---------------------------------------------------------------------

    @Test
    void updatingAttractionInformationProviderShouldDeleteOldProviderWhenItBecomesOrphan() throws Exception {
        // Create a brand-new attraction with a brand-new provider so that the
        // provider is referenced by exactly one attraction.
        String soleSourceName = "Sole-use source " + System.nanoTime();
        SaveAttractionRequest saveRequest = new SaveAttractionRequest(
                false, 1, null,
                "Attraction with sole-use source " + System.nanoTime(), null, null, null,
                AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE,
                true, false, null,
                soleSourceName, LocalDate.now().minusDays(1), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(saveRequest)))
                .andExpect(status().isCreated());

        Long attractionId = attractionRepo.findByName(saveRequest.attractionName()).getFirst().getId();
        Integer soleProviderId = informationProviderRepo.findBySourceName(soleSourceName).orElseThrow().getId();
        long providersBefore = informationProviderRepo.count();

        // Re-point the attraction at an existing provider; the previously
        // linked provider is no longer referenced and must be deleted.
        UpdateAttractionInformationProviderRequest updateRequest =
                new UpdateAttractionInformationProviderRequest("Functional Test 2", LocalDate.now().minusDays(2));

        mockMvc.perform(put("/attractions/" + attractionId + "/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.findById(soleProviderId)).isEmpty();
        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore - 1);
    }

    @Test
    void updatingAttractionInformationProviderShouldKeepOldProviderWhenStillReferencedByOtherAttraction() throws Exception {
        // Provider id=1 ('Functional Test') is referenced by attractions 1 and 3.
        // Updating attraction 1 must NOT delete the provider, since attraction 3 still uses it.
        Integer sharedProviderId = informationProviderRepo.findBySourceName("Functional Test").orElseThrow().getId();
        long providersBefore = informationProviderRepo.count();

        UpdateAttractionInformationProviderRequest request =
                new UpdateAttractionInformationProviderRequest("Functional Test 2", LocalDate.now().minusDays(1));

        mockMvc.perform(put("/attractions/1/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.findById(sharedProviderId)).isPresent();
        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore);
    }

    @Test
    void updatingAttractionInformationProviderWithSameNameShouldNotDeleteIt() throws Exception {
        // Re-saving the same provider must not orphan-delete it. Use attraction
        // with a sole-use provider so that sharing isn't masking the assertion.
        String soleSourceName = "Same-name source " + System.nanoTime();
        SaveAttractionRequest saveRequest = new SaveAttractionRequest(
                false, 1, null,
                "Attraction same-name " + System.nanoTime(), null, null, null,
                AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE,
                true, false, null,
                soleSourceName, LocalDate.now().minusDays(1), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(saveRequest)))
                .andExpect(status().isCreated());

        Long attractionId = attractionRepo.findByName(saveRequest.attractionName()).getFirst().getId();
        Integer providerId = informationProviderRepo.findBySourceName(soleSourceName).orElseThrow().getId();
        long providersBefore = informationProviderRepo.count();

        UpdateAttractionInformationProviderRequest request =
                new UpdateAttractionInformationProviderRequest(soleSourceName, LocalDate.now().minusDays(2));

        mockMvc.perform(put("/attractions/" + attractionId + "/informationProvider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.findById(providerId)).isPresent();
        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore);
    }

    @Test
    void deletingAttractionShouldDeleteInformationProviderWhenItBecomesOrphan() throws Exception {
        String soleSourceName = "Delete-orphan source " + System.nanoTime();
        SaveAttractionRequest saveRequest = new SaveAttractionRequest(
                false, 1, null,
                "Attraction to delete " + System.nanoTime(), null, null, null,
                AttractionCategoryDTO.BEVERAGE_SPOT, AttractionTypeDTO.STABLE,
                true, false, null,
                soleSourceName, LocalDate.now().minusDays(1), null);

        mockMvc.perform(post("/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1")
                        .content(mapper.writeValueAsString(saveRequest)))
                .andExpect(status().isCreated());

        Long attractionId = attractionRepo.findByName(saveRequest.attractionName()).getFirst().getId();
        Integer providerId = informationProviderRepo.findBySourceName(soleSourceName).orElseThrow().getId();
        long providersBefore = informationProviderRepo.count();

        mockMvc.perform(delete("/attractions/" + attractionId)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.findById(providerId)).isEmpty();
        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore - 1);
    }

    @Test
    void deletingAttractionShouldKeepInformationProviderWhenStillReferencedByOtherAttraction() throws Exception {
        // Provider id=3 ('Functional Test 3') is referenced by attractions 4 and 5.
        // Deleting attraction 4 must keep the provider since attraction 5 still uses it.
        Integer sharedProviderId = informationProviderRepo.findBySourceName("Functional Test 3").orElseThrow().getId();
        long providersBefore = informationProviderRepo.count();

        mockMvc.perform(delete("/attractions/4")
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());

        assertThat(informationProviderRepo.findById(sharedProviderId)).isPresent();
        assertThat(informationProviderRepo.count()).isEqualTo(providersBefore);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static SuggestionDto suggest(String value, Integer id) {
        return new SuggestionDto(value, id, StrategyApiType.RANK);
    }

    private record QueryAndSuggestions(String query, List<SuggestionDto> suggestedNames) {
    }
}
