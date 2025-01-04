package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
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

    @PutMapping("/{id:\\d+}/destination")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction destination", responses = {
            @ApiResponse(description = "Attraction destination is updated", responseCode = "204"),
    })
    public void updateAttractionDestination(@PathVariable String id, @RequestBody @Valid UpdateAttractionDestinationRequest attractionDestinationRequest) {
        attractionService.updateAttractionDestination(Long.parseLong(id), attractionDestinationRequest.isCountrywide(), attractionDestinationRequest.cityId(), attractionDestinationRequest.regionId());
    }

    @PutMapping("/{id:\\d+}/detail")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction detail", responses = {
            @ApiResponse(description = "Attraction detail is updated", responseCode = "204"),
    })
    public void updateAttractionDetail(@PathVariable String id, @RequestBody @Valid UpdateAttractionDetailRequest attractionDetailRequest) {
        attractionService.updateAttractionDetail(Long.parseLong(id), attractionDetailRequest.attractionName(), attractionDetailRequest.mainAttractionId());
    }

    @PutMapping("/{id:\\d+}/traditional")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction is traditional", responses = {
            @ApiResponse(description = "Attraction is updated", responseCode = "204"),
    })
    public void updateAttractionTraditional(@PathVariable String id, @RequestBody @Valid UpdateAttractionTraditionalRequest attractionDetailRequest) {
        attractionService.updateAttractionTraditional(Long.parseLong(id), attractionDetailRequest.isTraditional());
    }

    @PutMapping("/{id:\\d+}/location")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction Location", responses = {
            @ApiResponse(description = "Attraction Location is updated", responseCode = "204"),
    })
    public void updateAttractionLocation(@PathVariable String id, @RequestBody @Valid UpdateAttractionLocationRequest attractionDetailRequest) {
        attractionService.updateAttractionLocation(Long.parseLong(id), attractionDetailRequest.attractionAddress(), attractionDetailRequest.attractionLocation().latitude(), attractionDetailRequest.attractionLocation().longitude());
    }


//    //Category
//    @NotNull AttractionCategoryDTO attractionCategory,
//
//    //Type
//    @NotNull AttractionTypeDTO attractionType,
//
//    // mustVisit
//    @NotNull boolean mustVisit,
//
//    // Tip
//    @Size(max = 2048, message = "Tip may not be longer then {max}")
//    String tip,
//
//    //informationProvider
//    @NotBlank(message = "Attraction name may not be null or empty")
//    @Size(max = 512, message = "Information comes from may not be longer then {max}")
//    String infoFrom,
//    @NotNull LocalDate infoRecorded,
//
//    //Visit Period
//    DateSpanDTO optimalVisitPeriod


}
