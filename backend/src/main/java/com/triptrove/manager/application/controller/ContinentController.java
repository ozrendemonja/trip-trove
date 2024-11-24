package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.application.dto.SaveContinentResponse;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.service.ContinentService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
public class ContinentController {
    private final ContinentService continentService;

    @PostMapping("/continents")
    @CrossOrigin(origins = "http://localhost:8085")
    public SaveContinentResponse saveContinent(SaveContinentRequest saveContinentRequest) {
        Continent continent = new Continent();
        continent.setName(saveContinentRequest.continentName());

        short createdId = continentService.saveContinent(continent);
        return new SaveContinentResponse(createdId);
    }

    @GetMapping("/test")
    @CrossOrigin(origins = "http://localhost:8085")
    public String test() {
        return """
                {
                "message": "Hello world!"
                }
                """;
    }
}
