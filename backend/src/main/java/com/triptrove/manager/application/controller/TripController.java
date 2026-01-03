package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.*;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
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
    public void deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
    }

    @PostMapping("/{id:\\d+}/attractions/{attractionId:\\d+}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Add new attractions under trip", responses = {
            @ApiResponse(description = "Attractions added successfully", responseCode = "204"),
            @ApiResponse(description = "Attractions already added under the given trip", responseCode = "409", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void attachAttraction(@PathVariable Long id, @PathVariable Long attractionId, @RequestBody @Valid AddAttractionUnderTripRequest attraction) {
        tripService.attachAttraction(id, attractionId, attraction.rating().toRating(), attraction.note());
    }

    @DeleteMapping("/{id:\\d+}/attractions/{attractionId:\\d+}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove attraction from trip", responses = {
            @ApiResponse(description = "Attraction removed from trip", responseCode = "204"),
    })
    public void deleteTrip(@PathVariable Long id, @PathVariable Long attractionId) {
        tripService.deleteAttractionFromTrip(attractionId, id);
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