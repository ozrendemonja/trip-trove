package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.AddItineraryItemRequest;
import com.triptrove.manager.application.dto.ExtractGroupedAttractionRequest;
import com.triptrove.manager.application.dto.ItineraryItemFields;
import com.triptrove.manager.application.dto.ItineraryTransferDTO;
import com.triptrove.manager.application.dto.JoinItineraryAttractionRequest;
import com.triptrove.manager.application.dto.MoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.RemoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.ReorderGroupedAttractionsRequest;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.UpdateGroupedAttractionContributionRequest;
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
@RequestMapping(path = "/trips/{tripId:\\d+}/itinerary", headers = "x-api-version=1")
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
    public ResponseEntity<Void> scheduleAttraction(@PathVariable Long tripId,
            @RequestBody @Valid ScheduleAttractionRequest request) {
        scheduling.scheduleAttractionOnDay(tripId, request.date(), request.toSchedulingInput());
        return itineraryUpdated(tripId);
    }

    @PostMapping("/items")
    @Operation(summary = "Add a timed meal or other item to an itinerary day")
    @EntryUpdateResponses
    @ApiResponse(responseCode = "409", description = "The insertion position or transfers to remove changed",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> addItineraryItem(@PathVariable Long tripId, @RequestBody @Valid AddItineraryItemRequest request) {
        entryEditor.addItem(tripId, request.toItemToAdd());
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{entryId:\\d+}/item")
    @Operation(summary = "Edit a timed item's name, planned length, start lock and note without changing its kind")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryItem(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody @Valid ItineraryItemFields request) {
        entryEditor.updateItem(tripId, entryId, request.name(), request.plannedMinutes().intValueExact(),
                request.fixedStart(), request.note());
        return itineraryUpdated(tripId);
    }

    @PostMapping("/entries/{hostEntryId:\\d+}/grouped-attractions")
    @Operation(summary = "Join a trip attraction to an itinerary entry")
    @EntryUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> joinItineraryAttraction(@PathVariable Long tripId,
            @PathVariable Long hostEntryId,
            @RequestBody @Valid JoinItineraryAttractionRequest request) {
        var transfersToRemoveWithSourceEntry =
                ItineraryTransferDTO.toSummaries(request.transfersToRemoveWithSourceEntry());
        entryEditor.joinAttraction(tripId, hostEntryId, request.attractionId(), request.sourceEntryId(),
                request.visitDuration(), transfersToRemoveWithSourceEntry);
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{hostEntryId:\\d+}/grouped-attractions/{attractionId:\\d+}/duration-contribution")
    @Operation(summary = "Replace a grouped attraction's saved duration contribution in whole minutes")
    @TimingUpdateResponses
    @ApiResponse(responseCode = "409", description = "The attraction is no longer grouped on the requested entry",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> updateGroupedAttractionContribution(@PathVariable Long tripId,
            @PathVariable Long hostEntryId, @PathVariable Long attractionId,
            @RequestBody @Valid UpdateGroupedAttractionContributionRequest request) {
        entryEditor.updateGroupedAttractionContribution(tripId, hostEntryId, attractionId,
                request.contributionMinutes().intValueExact());
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{hostEntryId:\\d+}/grouped-attractions/order")
    @Operation(summary = "Save the order of the grouped attractions on an itinerary entry")
    @EntryUpdateResponses
    @ApiResponse(responseCode = "409", description = "The requested members do not match the saved group",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> reorderGroupedAttractions(@PathVariable Long tripId, @PathVariable Long hostEntryId,
            @RequestBody @Valid ReorderGroupedAttractionsRequest request) {
        entryEditor.reorderGroupedAttractions(tripId, hostEntryId, request.attractionIds());
        return itineraryUpdated(tripId);
    }

    @PostMapping("/entries/{hostEntryId:\\d+}/grouped-attractions/{attractionId:\\d+}/move-to-entry/{destinationEntryId:\\d+}")
    @Operation(summary = "Move a grouped attraction and its saved contribution to a different itinerary entry")
    @EntryUpdateResponses
    @ApiResponse(responseCode = "409", description = "The attraction is no longer grouped on the requested entry",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> moveGroupedAttraction(@PathVariable Long tripId, @PathVariable Long hostEntryId,
            @PathVariable Long attractionId, @PathVariable @Positive Long destinationEntryId) {
        entryEditor.moveGroupedAttraction(tripId, hostEntryId, attractionId, destinationEntryId);
        return itineraryUpdated(tripId);
    }

    @PostMapping("/entries/{hostEntryId:\\d+}/grouped-attractions/{attractionId:\\d+}/extract")
    @Operation(summary = "Extract a grouped attraction as a standalone entry with its saved contribution as planned length")
    @EntryUpdateResponses
    @ApiResponse(responseCode = "409", description = "The group, destination or transfers to remove changed",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> extractGroupedAttraction(@PathVariable Long tripId, @PathVariable Long hostEntryId,
            @PathVariable Long attractionId, @RequestBody @Valid ExtractGroupedAttractionRequest request) {
        var start = request.startTime() == null ? null : LocalTime.parse(request.startTime());
        entryEditor.extractGroupedAttraction(tripId, hostEntryId, attractionId, request.date(), request.beforeEntryId(),
                start, ItineraryTransferDTO.toSummaries(request.transfersToRemoveAtInsertionPoint()));
        return itineraryUpdated(tripId);
    }

    @DeleteMapping("/entries/{hostEntryId:\\d+}/grouped-attractions/{attractionId:\\d+}")
    @Operation(summary = "Remove a grouped attraction without removing it from the trip")
    @EntryUpdateResponses
    @ApiResponse(responseCode = "409", description = "The attraction is no longer grouped on the requested entry",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> removeGroupedAttraction(@PathVariable Long tripId, @PathVariable Long hostEntryId,
            @PathVariable Long attractionId) {
        entryEditor.removeGroupedAttraction(tripId, hostEntryId, attractionId);
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{entryId:\\d+}/start")
    @Operation(summary = "Set an itinerary entry's local start clock, keeping its planned length")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryStart(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryStartRequest request) {
        entryEditor.updateItineraryEntryStart(tripId, entryId, LocalTime.parse(request.startTime()));
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{entryId:\\d+}/end")
    @Operation(summary = "Set an itinerary entry's local end date and clock, keeping its start")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryEnd(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryEndRequest request) {
        entryEditor.updateItineraryEntryEnd(tripId, entryId, request.endDate(), LocalTime.parse(request.endTime()));
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{entryId:\\d+}/planned-length")
    @Operation(summary = "Set an itinerary entry's planned length in minutes, keeping its start")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryPlannedLength(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryPlannedLengthRequest request) {
        entryEditor.updateItineraryEntryPlannedLength(tripId, entryId, request.plannedMinutes().intValueExact());
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{entryId:\\d+}/fixed-start")
    @Operation(summary = "Lock or unlock an itinerary entry's start without changing its interval")
    @TimingUpdateResponses
    public ResponseEntity<Void> updateItineraryEntryFixedStart(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody @Valid UpdateItineraryEntryFixedStartRequest request) {
        entryEditor.updateItineraryEntryFixedStart(tripId, entryId, request.fixedStart());
        return itineraryUpdated(tripId);
    }

    @PutMapping("/transfers/{fromEntryId:\\d+}/{toEntryId:\\d+}")
    @Operation(summary = "Set the transfer between two consecutive entries on the same day")
    @TimingUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> updateItineraryTransfer(@PathVariable Long tripId, @PathVariable @Positive Long fromEntryId,
            @PathVariable @Positive Long toEntryId, @RequestBody @Valid UpdateItineraryTransferRequest request) {
        entryEditor.updateTransfer(tripId, fromEntryId, request.toTransfer(toEntryId));
        return itineraryUpdated(tripId);
    }

    @DeleteMapping("/transfers/{fromEntryId:\\d+}/{toEntryId:\\d+}")
    @Operation(summary = "Remove the entered transfer between two consecutive entries")
    @EntryUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> removeItineraryTransfer(@PathVariable Long tripId, @PathVariable @Positive Long fromEntryId,
            @PathVariable @Positive Long toEntryId) {
        entryEditor.removeTransfer(tripId, fromEntryId, toEntryId);
        return itineraryUpdated(tripId);
    }

    @PutMapping("/entries/{entryId:\\d+}/position")
    @Operation(summary = "Move an itinerary entry before another entry on a day, or to the end")
    @EntryUpdateResponses
    @TransferConflictResponse
    public ResponseEntity<Void> moveItineraryEntry(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody @Valid MoveItineraryEntryRequest request) {
        entryEditor.moveEntry(tripId, entryId, request.date(), request.beforeEntryId(), request.startOffset(),
                request.transferSummariesToRemove());
        return itineraryUpdated(tripId);
    }

    @DeleteMapping("/entries/{entryId:\\d+}")
    @Operation(summary = "Remove an itinerary entry, keeping its attraction on the trip if it has one")
    @EntryUpdateResponses
    @ApiResponse(responseCode = "409", description = "The grouped attractions or transfers to remove changed",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> removeItineraryEntry(@PathVariable Long tripId, @PathVariable Long entryId,
            @RequestBody(required = false) @Valid RemoveItineraryEntryRequest request) {
        var groupedIds = request == null ? null : request.groupedAttractionIdsToRemove();
        entryEditor.removeEntry(tripId, entryId, request == null ? List.of() : request.transferSummariesToRemove(),
                groupedIds == null ? List.of() : groupedIds);
        return itineraryUpdated(tripId);
    }

    private static ResponseEntity<Void> itineraryUpdated(Long tripId) {
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/trips/{tripId}/itinerary")
                .buildAndExpand(tripId)
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
