package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.RegionService;
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
@RequestMapping(path = "/regions", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "Region")
public class RegionController {
    private final RegionService regionService;

    @PostMapping()
    @Operation(summary = "Save new region", responses = {
            @ApiResponse(description = "Region saved successfully", responseCode = "201"),
            @ApiResponse(description = "Region already exists", responseCode = "409", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public ResponseEntity<Void> saveRegion(@RequestBody @Valid SaveRegionRequest regionRequest) {
        var result = regionService.saveRegion(regionRequest.regionName(), regionRequest.countryId());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(result.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    @Operation(summary = "List keyset-paginated regions by last modification time (creation time if never modified), then identifier. " +
            "Use the requested direction for both keys, or descending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "ASC for Oldest or DESC for Newest; defaults to DESC.")
    }, responses = {
            @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetRegionResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid cursor or direction",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public List<GetRegionResponse> getAllRegions(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            @Valid @ParameterObject RegionParameter after) {
        var afterRegion = after.toScrollPosition();
        return regionService.getRegions(afterRegion, sortDirection.toSortDirection())
                .stream()
                .map(GetRegionResponse::from)
                .toList();
    }

    @DeleteMapping(path = "/{id}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete region by its id", responses = {
            @ApiResponse(description = "Deleted region by its id", responseCode = "204"),
    })
    public void deleteRegion(@PathVariable Integer id) {
        regionService.deleteRegion(id);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve region by id", responses = {
            @ApiResponse(description = "Requested region", responseCode = "204"),
    })
    public GetRegionResponse getRegion(@PathVariable Integer id) {
        var region = regionService.getRegion(id);
        return GetRegionResponse.from(region);
    }

    @PutMapping("/{id:\\d+}/details")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update region details", responses = {
            @ApiResponse(description = "Region details are updated", responseCode = "204"),
    })
    public void updateRegionDetail(@PathVariable String id, @Valid @RequestBody UpdateRegionDetailsRequest regionDetailsRequest) {
        regionService.updateRegionDetails(Integer.parseInt(id), regionDetailsRequest.regionName());
    }

    @PutMapping("/{id:\\d+}/country")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update the country name of the region", responses = {
            @ApiResponse(description = "Region details are updated", responseCode = "204"),
    })
    public void updateRegionCountry(@PathVariable String id, @Valid @RequestBody UpdateRegionCountryRequest countryContinentRequest) {
        regionService.updateRegionCountryDetails(Integer.parseInt(id), countryContinentRequest.countryId());
    }
}
