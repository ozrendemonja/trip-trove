package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.MoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.RemoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryEndRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryFixedStartRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryPlannedLengthRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryStartRequest;
import com.triptrove.manager.application.dto.UpdateItineraryTransferRequest;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.ItineraryScheduling;
import com.triptrove.manager.domain.service.ItineraryEntryEditor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.net.URI;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping(path = "/trips/{id:\\d+}/itinerary", headers = "x-api-version=1")
@RequiredArgsConstructor
@Tag(name = "Trips")
public class ItineraryEntryController {
    private final ItineraryScheduling scheduling;
    private final ItineraryEntryEditor entryEditor;

    @PostMapping("/attractions")
    @Operation(summary = "Schedule an attraction on an itinerary day")
    @ApiResponse(responseCode = "204", description = "Attraction scheduled successfully",
            headers = @Header(name = "Location", description = "URI of the updated itinerary",
                    schema = @Schema(type = "string", format = "uri")))
    @ApiResponse(responseCode = "400", description = "Invalid proposed interval or missing scheduling inputs",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Trip or trip attraction not found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    @TransferConflictResponse
    public ResponseEntity<Void> scheduleAttraction(@PathVariable Long id,
            @RequestBody @Valid ScheduleAttractionRequest request) {
        scheduling.scheduleAttractionOnDay(id, request.date(), request.toSchedulingInput());
        return itineraryUpdated(id);
    }

    @PutMapping("/entries/{entryId:\\d+}/start")
    @Operation(summary = "Set an itinerary entry's local start clock, keeping its planned length")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryStart(@PathVariable Long id, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryStartRequest request) {
        entryEditor.updateItineraryEntryStart(id, entryId, LocalTime.parse(request.startTime()));
        return itineraryUpdated(id);
    }

    @PutMapping("/entries/{entryId:\\d+}/end")
    @Operation(summary = "Set an itinerary entry's local end date and clock, keeping its start")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryEnd(@PathVariable Long id, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryEndRequest request) {
        entryEditor.updateItineraryEntryEnd(id, entryId, request.endDate(), LocalTime.parse(request.endTime()));
        return itineraryUpdated(id);
    }

    @PutMapping("/entries/{entryId:\\d+}/planned-length")
    @Operation(summary = "Set an itinerary entry's planned length in minutes, keeping its start")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryPlannedLength(@PathVariable Long id, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryPlannedLengthRequest request) {
        entryEditor.updateItineraryEntryPlannedLength(id, entryId, request.plannedMinutes().intValueExact());
        return itineraryUpdated(id);
    }

    @PutMapping("/entries/{entryId:\\d+}/fixed-start")
    @Operation(summary = "Lock or unlock an itinerary entry's start without changing its interval")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryFixedStart(@PathVariable Long id, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryFixedStartRequest request) {
        entryEditor.updateItineraryEntryFixedStart(id, entryId, request.fixedStart());
        return itineraryUpdated(id);
    }

    @PutMapping("/transfers/{fromEntryId:\\d+}/{toEntryId:\\d+}")
    @Operation(summary = "Set the transfer between two consecutive entries on the same day")
    @TimingUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> updateItineraryTransfer(@PathVariable Long id, @PathVariable @Positive Long fromEntryId,
            @PathVariable @Positive Long toEntryId, @RequestBody @Valid UpdateItineraryTransferRequest request) {
        entryEditor.updateTransfer(id, fromEntryId, request.toTransfer(toEntryId));
        return itineraryUpdated(id);
    }

    @DeleteMapping("/transfers/{fromEntryId:\\d+}/{toEntryId:\\d+}")
    @Operation(summary = "Remove the entered transfer between two consecutive entries")
    @EntryUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> removeItineraryTransfer(@PathVariable Long id, @PathVariable @Positive Long fromEntryId,
            @PathVariable @Positive Long toEntryId) {
        entryEditor.removeTransfer(id, fromEntryId, toEntryId);
        return itineraryUpdated(id);
    }

    @PutMapping("/entries/{entryId:\\d+}/position")
    @Operation(summary = "Move an itinerary entry before another entry on a day, or to the end")
    @EntryUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> moveItineraryEntry(@PathVariable Long id, @PathVariable Long entryId,
            @RequestBody @Valid MoveItineraryEntryRequest request) {
        entryEditor.moveEntry(id, entryId, request.date(), request.beforeEntryId(), request.startOffset(),
                request.transferSummariesToRemove());
        return itineraryUpdated(id);
    }

    @DeleteMapping("/entries/{entryId:\\d+}")
    @Operation(summary = "Remove an itinerary entry without removing its attraction from the trip")
    @EntryUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> removeItineraryEntry(@PathVariable Long id, @PathVariable Long entryId,
            @RequestBody(required = false) @Valid RemoveItineraryEntryRequest request) {
        entryEditor.removeEntry(id, entryId, request == null ? List.of() : request.transferSummariesToRemove());
        return itineraryUpdated(id);
    }

    private static ResponseEntity<Void> itineraryUpdated(Long id) {
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/trips/{id}/itinerary")
                .buildAndExpand(id)
                .toUri();
        return ResponseEntity.noContent().location(location).build();
    }

    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    @ApiResponse(responseCode = "204", description = "Entry timing updated",
            headers = @Header(name = "Location", description = "URI of the updated itinerary",
                    schema = @Schema(type = "string", format = "uri")))
    @ApiResponse(responseCode = "400", description = "Invalid timing or conflict with the itinerary",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Entry not found in the trip",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    private @interface TimingUpdateResponses {}

    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    @ApiResponse(responseCode = "204", description = "Itinerary entry updated",
            headers = @Header(name = "Location", description = "URI of the updated itinerary",
                    schema = @Schema(type = "string", format = "uri")))
    @ApiResponse(responseCode = "400", description = "Invalid position or conflict with the itinerary",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Entry or destination entry not found in the trip",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    private @interface EntryUpdateResponses {}

    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    @ApiResponse(responseCode = "409", description = "Transfer neighbours changed or transfersToRemove does not match the change",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    private @interface TransferConflictResponse {}
}
