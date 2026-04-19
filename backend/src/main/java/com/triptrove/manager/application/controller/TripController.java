package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.TripService;
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
@RequestMapping(path = "/trips", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "Trips")
public class TripController {
    private TripService tripService;

    @PostMapping()
    @Operation(summary = "Save new trip", responses = {
            @ApiResponse(description = "Trip saved successfully", responseCode = "201"),
            @ApiResponse(description = "Trip already exists for the given date interval”", responseCode = "409", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public ResponseEntity<Void> saveTrip(@RequestBody @Valid SaveTripRequest tripRequest) {
        var trip = tripService.saveTrip(tripRequest.tripName(), tripRequest.fromDate(), tripRequest.toDate());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(trip.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping()
    @Operation(summary = "List paginable trips, sorted by their last updated time. If the trip was never updated, sort by the creation time. " +
            "Order by the given sort direction, or ascending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "Direction of ordering trips using last updated time, or by creation time if not updated."),
            @Parameter(name = "after", description = "Last trip retrieved on the previous page. Leave empty if this is the first page.")
    })
    public List<GetTripResponse> getTrips(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            TripParameter after) {
        var afterTrip = after.tripId() != null ? after.toScrollPosition() : null;
        return tripService.getTrips(afterTrip, sortDirection.toSortDirection())
                .stream()
                .map(GetTripResponse::from)
                .toList();
    }

    @GetMapping("/{id:\\d+}")
    @Operation(summary = "Retrieve trip by id", responses = {
            @ApiResponse(description = "Requested trip", responseCode = "204"),
    })
    public GetTripResponse getTrip(@PathVariable Long id) {
        var attraction = tripService.getTrip(id);
        return GetTripResponse.from(attraction);
    }

    @PutMapping("/{id:\\d+}/name")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update trip name", responses = {
            @ApiResponse(description = "Trip name is updated", responseCode = "204"),
    })
    public void updateTripDetail(@PathVariable Long id, @RequestBody @Valid UpdateTripNameRequest tripNameRequest) {
        tripService.updateTripName(id, tripNameRequest.tripName());
    }

    @PutMapping("/{id:\\d+}/range")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update trip range", responses = {
            @ApiResponse(description = "Trip range is updated", responseCode = "204"),
    })
    public void updateTripRange(@PathVariable Long id, @RequestBody @Valid UpdateTripRangeRequest tripRangeRequest) {
        tripService.updateTripRange(id, tripRangeRequest.fromDate(), tripRangeRequest.toDate());
    }

    @DeleteMapping(path = "/{id:\\d+}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete trip by its id", responses = {
            @ApiResponse(description = "Deleted trip by its id", responseCode = "204"),
    })
    public void detachAttraction(@PathVariable Long id) {
        tripService.deleteTrip(id);
    }

    @PostMapping("/{id:\\d+}/attractions")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Add attraction under trip", responses = {
            @ApiResponse(description = "Attraction added successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction already added under the given trip", responseCode = "409", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void attachAttraction(@PathVariable Long id, @RequestBody @Valid AddAttractionUnderTripRequest attraction) {
        tripService.attachAttraction(id, attraction.attractionId(), attraction.attractionGroup().toGroup());
    }

    @PostMapping("/{id:\\d+}/attractions/{attractionId:\\d+}/review")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Review attraction under trip", responses = {
            @ApiResponse(description = "Attraction reviewed successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction not found under trip", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void reviewAttraction(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid ReviewTripAttractionRequest request) {
        tripService.reviewAttraction(id, attractionId,
                request.rating().toRating(),
                request.note());
    }

    @PutMapping("/{id:\\d+}/attractions/{attractionId:\\d+}/group")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction group under trip", responses = {
            @ApiResponse(description = "Attraction group updated successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction not found under trip", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateAttractionGroup(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid UpdateAttractionGroupRequest request) {
        tripService.updateAttractionGroup(id, attractionId, request.attractionGroup().toGroup());
    }

    @PutMapping("/{id:\\d+}/attractions/{attractionId:\\d+}/must-visit")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction must visit under trip", responses = {
            @ApiResponse(description = "Attraction must visit updated successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction not found under trip", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateAttractionMustVisit(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid UpdateTripAttractionMustVisitRequest request) {
        tripService.updateAttractionMustVisit(id, attractionId, request.mustVisit());
    }

    @PutMapping("/{id:\\d+}/attractions/{attractionId:\\d+}/working-hours")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction working hours under trip", responses = {
            @ApiResponse(description = "Attraction working hours updated successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction not found under trip", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateAttractionWorkingHours(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid UpdateTripAttractionWorkingHoursRequest request) {
        tripService.updateAttractionWorkingHours(id, attractionId, request.workingHours());
    }

    @PutMapping("/{id:\\d+}/attractions/{attractionId:\\d+}/visit-time")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction visit time under trip", responses = {
            @ApiResponse(description = "Attraction visit time updated successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction not found under trip", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateAttractionVisitTime(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid UpdateTripAttractionVisitTimeRequest request) {
        tripService.updateAttractionVisitTime(id, attractionId, request.visitTime());
    }

    @PutMapping("/{id:\\d+}/attractions/{attractionId:\\d+}/note")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Update attraction note under trip", responses = {
            @ApiResponse(description = "Attraction note updated successfully", responseCode = "204"),
            @ApiResponse(description = "Attraction not found under trip", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateAttractionNote(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid UpdateTripAttractionNoteRequest request) {
        tripService.updateAttractionNote(id, attractionId, request.note());
    }

    @DeleteMapping("/{id:\\d+}/attractions/{attractionId:\\d+}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove attraction from trip", responses = {
            @ApiResponse(description = "Attraction removed from trip", responseCode = "204"),
    })
    public void detachAttraction(@PathVariable Long id, @PathVariable Long attractionId) {
        tripService.detachAttraction(id, attractionId);
    }

    @GetMapping("/{id:\\d+}/attractions")
    @Operation(summary = "Get all attractions for a trip", responses = {
            @ApiResponse(description = "List of attractions under the trip", responseCode = "200"),
    })
    public List<GetTripAttractionResponse> getAttractions(@PathVariable Long id) {
        return tripService.getAttractions(id)
                .stream()
                .map(GetTripAttractionResponse::from)
                .toList();
    }

    @GetMapping("/countries/summary")
    @Operation(summary = "Countries summary for trips", responses = {
            @ApiResponse(description = "Countries summary", responseCode = "204"),
    })
    public GetCountriesSummaryResponse getCountriesSummary() {
        var countriesSummary = tripService.getCountriesSummary();
        return GetCountriesSummaryResponse.from(countriesSummary);
    }

}