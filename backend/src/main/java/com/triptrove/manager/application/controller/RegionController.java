package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.GetRegionResponse;
import com.triptrove.manager.application.dto.RegionParameter;
import com.triptrove.manager.application.dto.SaveRegionRequest;
import com.triptrove.manager.application.dto.SortDirectionParameter;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.RegionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
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
    @Operation(summary = "List paginable regions, sorted by their last updated time. If the region was never updated, sort by the creation time. " +
            "Order by the given sort direction, or ascending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "Direction of ordering regions using last updated time, or by creation time if not updated."),
            @Parameter(name = "after", description = "Last regions retrieved on the previous page. Leave empty if this is the first page.")
    })
    public List<GetRegionResponse> getAllCountries(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            RegionParameter after) {
        boolean isFirstPage = after == null || after.regionId() == null;
        if (isFirstPage) {
            return regionService.getRegions(sortDirection.toSortDirection())
                    .stream()
                    .map(GetRegionResponse::from)
                    .toList();
        }
        return regionService.getRegions(after.toScrollPosition(), sortDirection.toSortDirection())
                .stream()
                .map(GetRegionResponse::from)
                .toList();
    }

}
