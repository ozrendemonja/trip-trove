package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.GetCityResponse;
import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.GetCountryResponse;
import com.triptrove.manager.application.dto.GetRegionResponse;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class EmptyTableTest extends AbstractIntegrationTest {
    private final static ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Test
    void regionListShouldBeReturnedEmptyWhenNoRegionExists() throws Exception {
        var jsonResponse = mockMvc.perform(get("/regions")
                        .param("sd", "ASC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetRegionResponse[] response = mapper.readValue(jsonResponse, GetRegionResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    void cityListShouldBeReturnedEmptyWhenNoCityExists() throws Exception {
        var jsonResponse = mockMvc.perform(get("/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCityResponse[] response = mapper.readValue(jsonResponse, GetCityResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    void emptyListOfCountriesShouldBeReturnWhenNoCountriesAreAdded() throws Exception {
        var jsonResponse = mockMvc.perform(get("/countries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetCountryResponse[] response = mapper.readValue(jsonResponse, GetCountryResponse[].class);
        assertThat(response).isEmpty();
    }

    @Test
    void emptyListOfContinentsShouldBeReturnedWhenThereIsNoContinentSaved() throws Exception {
        var jsonResponse = mockMvc.perform(get("/continents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        GetContinentResponse[] response = mapper.readValue(jsonResponse, GetContinentResponse[].class);
        assertThat(response).isEmpty();
    }
}
