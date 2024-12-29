package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.SaveRegionRequest;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.RegionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

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
}
