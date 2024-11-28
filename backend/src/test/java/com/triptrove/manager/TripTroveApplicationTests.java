package com.triptrove.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.domain.repo.ContinentRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
	void continentShouldBeSavedWhenRequestIsSent() throws Exception {
		final String newContinent = "Test continent";
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

}
