package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.AttractionParameter;
import com.triptrove.manager.application.dto.GetAttractionResponse;
import com.triptrove.manager.application.dto.SaveAttractionRequest;
import com.triptrove.manager.application.dto.SortDirectionParameter;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.AttractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
@RequestMapping(path = "/attractions", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "Attractions")
public class AttractionController {
    private final AttractionService attractionService;

    @PostMapping()
    @Operation(summary = "Save new attraction", responses = {
            @ApiResponse(description = "Attraction saved successfully", responseCode = "201"),
            @ApiResponse(description = "Attraction already exists", responseCode = "409", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public ResponseEntity<Void> saveAttraction(@RequestBody @Valid SaveAttractionRequest attractionRequest) {
        var attraction = attractionService.saveAttraction(attractionRequest.regionId(), attractionRequest.cityId(), attractionRequest.mainAttractionId(), attractionRequest.toAttraction());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(attraction.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    @Operation(summary = "List paginable attractions, sorted by their last updated time. If the attraction was never updated, sort by the creation time. " +
            "Order by the given sort direction, or ascending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "Direction of ordering attractions using last updated time, or by creation time if not updated."),
            @Parameter(name = "after", description = "Last attraction retrieved on the previous page. Leave empty if this is the first page.")
    })
    public List<GetAttractionResponse> getAttractions(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            AttractionParameter after) {
        boolean isFirstPage = after == null || after.attractionId() == null;
        if (isFirstPage) {
            return attractionService.getAttractions(sortDirection.toSortDirection())
                    .stream()
                    .map(GetAttractionResponse::from)
                    .toList();
        }
        return attractionService.getAttractions(after.toScrollPosition(), sortDirection.toSortDirection())
                .stream()
                .map(GetAttractionResponse::from)
                .toList();
    }

    @DeleteMapping(path = "/{id}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete attraction by its id", responses = {
            @ApiResponse(description = "Deleted attraction by its id", responseCode = "204"),
    })
    public void deleteAttraction(@PathVariable Long id) {
        attractionService.deleteAttraction(id);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve attraction by id", responses = {
            @ApiResponse(description = "Requested attraction", responseCode = "204"),
    })
    public GetAttractionResponse getAttraction(@PathVariable Long id) {
        var attraction = attractionService.getAttraction(id);
        return GetAttractionResponse.from(attraction);
    }


}
