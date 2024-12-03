package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.service.ContinentService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping(path = "/continents", headers = "x-api-version=1")
public class ContinentController {
    private final ContinentService continentService;

    @PostMapping()
    @CrossOrigin(origins = "http://localhost:8085")
    public ResponseEntity<Void> saveContinent(@RequestBody SaveContinentRequest saveContinentRequest) {
        Continent continent = new Continent();
        continent.setName(saveContinentRequest.continentName());

        String continentName = continentService.saveContinent(continent);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{country}")
                .buildAndExpand(continentName)
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    public List<GetContinentResponse> getAllContinents(){
        return continentService.getAllContinents()
                .stream()
                .map(continent -> new GetContinentResponse(continent.getName()))
                .toList();
    }

    @DeleteMapping(path = "/{name}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteContinent(@PathVariable String name){
        continentService.deleteContinent(name);
    }

}
