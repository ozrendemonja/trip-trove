package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.CountryParameter;
import com.triptrove.manager.application.dto.GetCountryResponse;
import com.triptrove.manager.application.dto.SaveCountryRequest;
import com.triptrove.manager.application.dto.SortDirectionParameter;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.model.ObjectNotFoundException;
import com.triptrove.manager.domain.service.CountryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
        var result = countryService.saveCountry(countryRequest.continentName(), countryRequest.countryName());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{country}")
                .buildAndExpand(result)
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    @Operation(summary = "List paginable countries, sorted by their last updated time. If the country was never updated, sort by the creation time. " +
            "Order by the given sort direction, or ascending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "Direction of ordering countries using last updated time, or by creation time if not updated."),
            @Parameter(name = "after", description = "Last country retrieved on the previous page. Leave empty if this is the first page.")
    })
    public List<GetCountryResponse> getAllCountries(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            CountryParameter after) {
        boolean isFirstPage = after == null || after.countryId() == null;
        if (isFirstPage) {
            return countryService.getCountries(sortDirection.toSortDirection())
                    .stream()
                    .map(GetCountryResponse::from)
                    .toList();
        }
        return countryService.getCountries(after.toCountryScrollPosition(), sortDirection.toSortDirection())
                .stream()
                .map(GetCountryResponse::from)
                .toList();
    }

    @ResponseStatus(value = HttpStatus.CONFLICT)
    @ExceptionHandler(DuplicateNameException.class)
    public void duplicateName() {
        // Nothing needed because of transition to global exception handler
    }

    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    @ExceptionHandler(ObjectNotFoundException.class)
    public void objectNotFound() {
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
