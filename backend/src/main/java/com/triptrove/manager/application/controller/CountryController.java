package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.ContinentName;
import com.triptrove.manager.domain.CountryName;
import com.triptrove.manager.domain.service.CountryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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
        var result = countryService.saveCountry(
                new ContinentName(countryRequest.continentName()),
                new CountryName(countryRequest.countryName()),
                countryRequest.isoCode());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(result.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    @Operation(summary = "List keyset-paginated countries by last modification time (creation time if never modified), then identifier. " +
            "Use the requested direction for both keys, or descending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "ASC for Oldest or DESC for Newest; defaults to DESC.")
    }, responses = {
            @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetCountryResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid cursor or direction",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public List<GetCountryResponse> getAllCountries(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            @Valid @ParameterObject CountryParameter after) {
        var afterCountry = after.toScrollPosition();
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
                countryService.updateCountryDetails(Integer.valueOf(id), new CountryName(countryDetailsRequest.countryName()));
    }

    @PutMapping("/{id:\\d+}/continent")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update the continent name of the country", responses = {
            @ApiResponse(description = "Country details are updated", responseCode = "204"),
    })
    public void updateCountryContinent(@PathVariable String id, @Valid @RequestBody UpdateCountryContinentRequest countryContinentRequest) {
                countryService.updateCountryContinentDetails(Integer.valueOf(id), new ContinentName(countryContinentRequest.continentName()));
    }

    @PutMapping("/{id:\\d+}/iso-code")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update the ISO 3166-1 alpha-2 code of the country", responses = {
            @ApiResponse(description = "Country ISO code is updated", responseCode = "204"),
    })
    public void updateCountryIsoCode(@PathVariable String id, @Valid @RequestBody UpdateCountryIsoCodeRequest countryIsoCodeRequest) {
        countryService.updateCountryIsoCode(Integer.valueOf(id), countryIsoCodeRequest.isoCode());
    }
}
