package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.domain.service.CountryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

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
                .path("/{id}")
                .buildAndExpand(result.getId())
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
        var afterCountry = after.countryId() != null ? after.toScrollPosition() : null;
        return countryService.getCountries(afterCountry, sortDirection.toSortDirection())
                .stream()
                .map(GetCountryResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve country by id", responses = {
            @ApiResponse(description = "Requested country", responseCode = "204"),
    })
    public GetCountryResponse getCountry(@PathVariable Integer id) {
        var country = countryService.getCountry(id);
        return GetCountryResponse.from(country);
    }

    @DeleteMapping(path = "/{id}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete country by its id", responses = {
            @ApiResponse(description = "Deleted country by its id", responseCode = "204"),
    })
    public void deleteCountry(@PathVariable Integer id) {
        countryService.deleteCountry(id);
    }

    @PutMapping("/{id:\\d+}/details")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update country details", responses = {
            @ApiResponse(description = "Country details are updated", responseCode = "204"),
    })
    public void updateCountryDetail(@PathVariable String id, @Valid @RequestBody UpdateCountryDetailsRequest countryDetailsRequest) {
        countryService.updateCountryDetails(Integer.valueOf(id), countryDetailsRequest.countryName());
    }

    @PutMapping("/{id:\\d+}/continent")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update the continent name of the country", responses = {
            @ApiResponse(description = "Country details are updated", responseCode = "204"),
    })
    public void updateCountryContinent(@PathVariable String id, @RequestBody UpdateCountryContinentRequest countryContinentRequest) {
        countryService.updateCountryContinentDetails(Integer.valueOf(id), countryContinentRequest.continentName());
    }
}
