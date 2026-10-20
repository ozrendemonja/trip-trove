package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.CityService;
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
@RequestMapping(path = "/cities", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "City")
public class CityController {
    private final CityService cityService;

    @PostMapping()
    @Operation(summary = "Save new city", responses = {@ApiResponse(description = "City saved successfully", responseCode = "201"), @ApiResponse(description = "City already exists", responseCode = "409", content = {@Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))})})
    public ResponseEntity<Void> saveCity(@RequestBody @Valid SaveCityRequest cityRequest) {
        var result = cityService.saveCity(cityRequest.cityName(), cityRequest.regionId());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.getId()).toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    @Operation(summary = "List keyset-paginated cities by last modification time (creation time if never modified), then identifier. " +
            "Use the requested direction for both keys, or descending if none is provided.", parameters =
            @Parameter(name = "sd", description = "ASC for Oldest or DESC for Newest; defaults to DESC."),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetCityResponse.class)))),
                    @ApiResponse(responseCode = "400", description = "Invalid cursor or direction",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<GetCityResponse> getAllCities(@RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
                                            @Valid @ParameterObject CityParameter after) {
        var afterCity = after.toScrollPosition();
        return cityService.getCities(afterCity, sortDirection.toSortDirection()).stream().map(GetCityResponse::from).toList();
    }

    @DeleteMapping(path = "/{id}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete city by its id", responses = {@ApiResponse(description = "Deleted city by its id", responseCode = "204"),})
    public void deleteCity(@PathVariable Integer id) {
        cityService.deleteCity(id);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve city by id", responses = {@ApiResponse(description = "Requested city", responseCode = "204"),})
    public GetCityResponse getCity(@PathVariable Integer id) {
        var city = cityService.getCity(id);
        return GetCityResponse.from(city);
    }

    @PutMapping("/{id:\\d+}/details")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update city details", responses = {@ApiResponse(description = "City details are updated", responseCode = "204"),})
    public void updateCityDetail(@PathVariable String id, @RequestBody @Valid UpdateCityDetailsRequest updateCityDetailsRequest) {
        cityService.updateCityDetails(Integer.parseInt(id), updateCityDetailsRequest.cityName());
    }

    @PutMapping("/{id:\\d+}/region")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update the city name of the region", responses = {@ApiResponse(description = "City details are updated", responseCode = "204"),})
    public void updateCityRegion(@PathVariable String id, @RequestBody @Valid UpdateCityRegionRequest cityRegionRequest) {
        cityService.updateCityRegionDetails(Integer.parseInt(id), cityRegionRequest.regionId());
    }
}
