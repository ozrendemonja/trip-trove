package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.model.ObjectNotFoundException;
import com.triptrove.manager.domain.service.ContinentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping(path = "/continents", headers = "x-api-version=1")
public class ContinentController {
    private final ContinentService continentService;

    @PostMapping()
    public ResponseEntity<Void> saveContinent(@RequestBody @Valid SaveContinentRequest saveContinentRequest) {
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

    @GetMapping("/{name}")
    public GetContinentResponse getContinent(@PathVariable String name) {
        var continent = continentService.getContinent(name);
        return new GetContinentResponse(continent.getName());
    }

    @ResponseStatus(value=HttpStatus.NOT_FOUND)
    @ExceptionHandler(ObjectNotFoundException.class)
    public void objectNotFound() {}

    @ResponseStatus(value=HttpStatus.CONFLICT)
    @ExceptionHandler(DuplicateNameException.class)
    public void duplicateName() {}

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, String> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return errors;
    }
}
