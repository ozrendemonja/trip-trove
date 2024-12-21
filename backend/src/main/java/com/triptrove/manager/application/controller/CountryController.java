package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.SaveCountryRequest;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.service.CountryService;
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
import java.util.Map;

@RestController
@RequestMapping(path = "/countries", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "Country")
public class CountryController {
    private final CountryService countryService;

    @PostMapping()
    @Operation(summary = "Save new country", responses = {
            @ApiResponse(description = "Country saved successfully", responseCode = "201"),
            @ApiResponse(description = "Country already exists", responseCode = "409")
    })
    public ResponseEntity<Void> saveCountry(@RequestBody @Valid SaveCountryRequest countryRequest) {
        var country = new Country();
        country.setName(countryRequest.countryName());

        var result = countryService.saveCountry(country);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{country}")
                .buildAndExpand(result)
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @ResponseStatus(value = HttpStatus.CONFLICT)
    @ExceptionHandler(DuplicateNameException.class)
    public void duplicateName() {
    }

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
