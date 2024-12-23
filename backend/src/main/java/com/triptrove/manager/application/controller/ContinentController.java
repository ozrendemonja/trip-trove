package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.GetContinentResponse;
import com.triptrove.manager.application.dto.SaveContinentRequest;
import com.triptrove.manager.application.dto.SortDirectionParameter;
import com.triptrove.manager.application.dto.UpdateContinentRequest;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.model.ObjectNotFoundException;
import com.triptrove.manager.domain.service.ContinentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Continent")
public class ContinentController {
    private final ContinentService continentService;


    @PostMapping()
    @Operation(summary = "Save new continent", responses = {
            @ApiResponse(description = "Continent saved successfully", responseCode = "201"),
            @ApiResponse(description = "Continent already exists", responseCode = "409")
    })
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
    @Operation(summary = "List all saved continents, sorted by the time they were last updated. If the continent was never updated, sort by the creation time. " +
            "Order by the given sort direction, or ascending if none is provided.")
    public List<GetContinentResponse> getAllContinents(@RequestParam(defaultValue = "ASC", name = "sd") SortDirectionParameter sortDirection) {
        return continentService.getAllContinents(sortDirection.toSortDirection())
                .stream()
                .map(continent -> new GetContinentResponse(continent.getName()))
                .toList();
    }

    @DeleteMapping(path = "/{name}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete continent by name", responses = {
            @ApiResponse(description = "Deleted continent by name", responseCode = "204"),
    })
    public void deleteContinent(@PathVariable String name) {
        continentService.deleteContinent(name);
    }

    @GetMapping("/{name}")
    @Operation(summary = "Retrieve continent by name", responses = {
            @ApiResponse(description = "Requested continent", responseCode = "200"),
    })
    public GetContinentResponse getContinent(@PathVariable String name) {
        var continent = continentService.getContinent(name);
        return new GetContinentResponse(continent.getName());
    }

    @PutMapping("/{name}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update continent name", responses = {
            @ApiResponse(description = "Continent name is updated", responseCode = "204"),
    })
    public void updateContinent(@PathVariable String name, @RequestBody @Valid UpdateContinentRequest request) {
        continentService.updateContinent(name, request.continentName());
    }

    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    @ExceptionHandler(ObjectNotFoundException.class)
    public void objectNotFound() {
        // Nothing needed because of transition to global exception handler
    }

    @ResponseStatus(value = HttpStatus.CONFLICT)
    @ExceptionHandler(DuplicateNameException.class)
    public void duplicateName() {
        // Nothing needed because of transition to global exception handler
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, String> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return errors;
    }
}
