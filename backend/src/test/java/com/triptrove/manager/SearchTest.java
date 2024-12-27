package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
public class SearchTest {
    private final static ObjectMapper mapper = new ObjectMapper();
    public static final String CONTINENT_NAME_0 = "Test continent";
    public static final String CONTINENT_NAME_1 = "Test continent new";
    public static final String COUNTRY_NAME_0 = "Test country 0";
    public static final String COUNTRY_NAME_1 = "Test country 1";
    public static final String COUNTRY_NAME_2 = "New ctest 2";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CountryRepo countryRepo;

    @Autowired
    private ContinentRepo continentRepo;

    @BeforeEach
    void setupContinent() {
        var continent0 = new Continent();
        continent0.setName(CONTINENT_NAME_0);
        continentRepo.save(continent0);

        var continent1 = new Continent();
        continent1.setName(CONTINENT_NAME_1);
        continentRepo.save(continent1);

        var country0 = new Country();
        country0.setName(COUNTRY_NAME_0);
        country0.setContinent(continent0);
        country0.setId(0);
        country0.setCreatedOn(LocalDateTime.now().minusDays(4));
        countryRepo.save(country0);
        var country1 = new Country();
        country1.setName(COUNTRY_NAME_1);
        country1.setContinent(continent0);
        country1.setId(1);
        country1.setCreatedOn(LocalDateTime.now().minusDays(3));
        countryRepo.save(country1);
        var country2 = new Country();
        country2.setName(COUNTRY_NAME_2);
        country2.setContinent(continent0);
        country2.setId(2);
        country2.setCreatedOn(LocalDateTime.now().minusDays(2));
        countryRepo.save(country2);
        var country3 = new Country();
        country3.setName(COUNTRY_NAME_0);
        country3.setContinent(continent1);
        country3.setId(3);
        country3.setCreatedOn(LocalDateTime.now().minusDays(4));
        countryRepo.save(country3);
        var country4 = new Country();
        country4.setName(COUNTRY_NAME_1);
        country4.setContinent(continent1);
        country4.setId(4);
        country4.setCreatedOn(LocalDateTime.now().minusDays(3));
        countryRepo.save(country4);
    }

    @ParameterizedTest
    @MethodSource("provideValidCountryQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void returnAllCountryNamesWhichGivenSearchStringIsSubstringOfWhenSearchByCountryName(TestAbc input) throws Exception {
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input.query())
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input.query());
        assertThat(response.suggestions()).hasSize(input.suggestedNames().size());
        assertThat(response.suggestions().stream().map(SuggestionDto::value).toList()).isEqualTo(input.suggestedNames());
        assertThat(response.suggestions().stream().map(SuggestionDto::strategyType).collect(Collectors.toSet())).isEqualTo(Set.of(StrategyApiType.RANK));
    }

    private record TestAbc(String query, List<String> suggestedNames) {
    }

    private static Stream<TestAbc> provideValidCountryQueries() {
        return Stream.of(
                new TestAbc("Tes", List.of(COUNTRY_NAME_0, COUNTRY_NAME_1, COUNTRY_NAME_0, COUNTRY_NAME_1)),
                new TestAbc("Test", List.of(COUNTRY_NAME_0, COUNTRY_NAME_1, COUNTRY_NAME_0, COUNTRY_NAME_1)),
                new TestAbc("Test ", List.of(COUNTRY_NAME_0, COUNTRY_NAME_1, COUNTRY_NAME_0, COUNTRY_NAME_1)),
                new TestAbc("Test c", List.of(COUNTRY_NAME_0, COUNTRY_NAME_1, COUNTRY_NAME_0, COUNTRY_NAME_1)),
                new TestAbc("New", List.of(COUNTRY_NAME_2))
        );
    }


    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void returnEmptyListAsResultWhenGivenSearchStringIsNotSubstringOfAnyCountryName() throws Exception {
        String input = "Not valid";
        var jsonResponse = mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetSearchResponse response = mapper.readValue(jsonResponse, GetSearchResponse.class);
        assertThat(response.prefix()).isEqualTo(input);
        assertThat(response.suggestions()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("provideInValidCountryQueries")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
        // TMP solution for non existing clear of database
    void userShouldGetConflictResponseWhenCountryQueryNameIsTooShort(String input) throws Exception {
        mockMvc.perform(get("/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("q", input)
                        .param("i", "COUNTRY")
                        .header("x-api-version", "1"))
                .andExpect(status().isBadRequest());
//                .andExpect(jsonPath("$.countryName", Is.is("Test"))); // TODO Add after global exception handler is added
    }

    private static Stream<String> provideInValidCountryQueries() {
        return Stream.of("", " ", "       ", "T", "Te");
    }

}
