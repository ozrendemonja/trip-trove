package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.domain.repo.ContinentRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
class TripTroveApplicationTests {
	private final static ObjectMapper mapper = new ObjectMapper();

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ContinentRepo continentRepo;

	@Test
	@DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD) // TMP solution for non existing clear of database
	void continentShouldBeSavedWhenRequestIsSent() throws Exception {
		final String newContinent = "Test continent 0";
		var request = new SaveContinentRequest(newContinent);

		mockMvc.perform(post("/continents")
						.contentType(MediaType.APPLICATION_JSON)
						.header("x-api-version", "1")
						.content(mapper.writeValueAsString(request)))
				.andExpect(status().isCreated())
				.andExpect(header().string(HttpHeaders.LOCATION, "http://localhost/continents/" + UriUtils.encode(newContinent, StandardCharsets.UTF_8)));

		assertThat(continentRepo.findAll().size()).isEqualTo(1);
		assertThat(continentRepo.findAll().getFirst().getName()).isEqualTo(newContinent);
	}

	@Test
	void allContinentsShouldBeReturnedWhenRequestIsSent() throws Exception {
		var expected = new GetContinentResponse[3];
		var request = new SaveContinentRequest("Test continent 0");
		expected[0] = new GetContinentResponse("Test continent 0");
		mockMvc.perform(post("/continents")
				.contentType(MediaType.APPLICATION_JSON)
				.header("x-api-version", "1")
				.content(mapper.writeValueAsString(request)));

		request = new SaveContinentRequest("Test continent 1");
		expected[1] = new GetContinentResponse("Test continent 1");
		mockMvc.perform(post("/continents")
				.contentType(MediaType.APPLICATION_JSON)
				.header("x-api-version", "1")
				.content(mapper.writeValueAsString(request)));

		request = new SaveContinentRequest("Test continent 2");
		expected[2] = new GetContinentResponse("Test continent 2");
		mockMvc.perform(post("/continents")
				.contentType(MediaType.APPLICATION_JSON)
				.header("x-api-version", "1")
				.content(mapper.writeValueAsString(request)));

		var jsonResponse = mockMvc.perform(get("/continents")
						.contentType(MediaType.APPLICATION_JSON)
						.header("x-api-version", "1"))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		GetContinentResponse[] response = mapper.readValue(jsonResponse, GetContinentResponse[].class);
		assertThat(response).hasSameElementsAs(Arrays.stream(expected).toList());
	}

	@Test
	void continentsShouldBeDeletedWhenRequestIsSent() throws Exception {
		var request = new SaveContinentRequest("Test continent0");
		mockMvc.perform(post("/continents")
				.contentType(MediaType.APPLICATION_JSON)
				.header("x-api-version", "1")
				.content(mapper.writeValueAsString(request)));

		request = new SaveContinentRequest("Test continent1");
		mockMvc.perform(post("/continents")
				.contentType(MediaType.APPLICATION_JSON)
				.header("x-api-version", "1")
				.content(mapper.writeValueAsString(request)));

		request = new SaveContinentRequest("Test continent2");
		mockMvc.perform(post("/continents")
				.contentType(MediaType.APPLICATION_JSON)
				.header("x-api-version", "1")
				.content(mapper.writeValueAsString(request)));


		mockMvc.perform(delete("/continents/" + "Test continent0")
						.contentType(MediaType.APPLICATION_JSON)
						.header("x-api-version", "1"))
				.andExpect(status().isNoContent());
		mockMvc.perform(delete("/continents/" + "Test continent1")
						.contentType(MediaType.APPLICATION_JSON)
						.header("x-api-version", "1"))
				.andExpect(status().isNoContent());
		mockMvc.perform(delete("/continents/" + "Test continent2")
						.contentType(MediaType.APPLICATION_JSON)
						.header("x-api-version", "1"))
				.andExpect(status().isNoContent());


		assertThat(continentRepo.findAll()).isEmpty();
	}
}
