package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.ItineraryScheduling;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping(path = "/trips/{id:\\d+}/itinerary/attractions", headers = "x-api-version=1")
@RequiredArgsConstructor
@Tag(name = "Trips")
public class ItinerarySchedulingController {
    private final ItineraryScheduling scheduling;

    @PostMapping
    @Operation(summary = "Schedule an attraction on an itinerary day")
    @ApiResponse(responseCode = "204", description = "Attraction scheduled successfully",
            headers = @Header(name = "Location", description = "URI of the updated itinerary",
                    schema = @Schema(type = "string", format = "uri")))
    @ApiResponse(responseCode = "400", description = "Invalid proposed interval or missing scheduling inputs",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Trip or trip attraction not found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> scheduleAttraction(@PathVariable Long id,
            @RequestBody @Valid ScheduleAttractionRequest request) {
        scheduling.scheduleAttractionOnDay(id, request.date(), request.toSchedulingInput());

        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/trips/{id}/itinerary")
                .buildAndExpand(id)
                .toUri();
        return ResponseEntity.noContent().location(location).build();
    }
}
