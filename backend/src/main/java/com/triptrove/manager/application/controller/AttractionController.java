package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.SaveAttractionRequest;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.AttractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

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
    public ResponseEntity<Void> saveAttraction(@RequestBody SaveAttractionRequest attractionRequest) {
        var attraction = attractionService.saveAttraction(attractionRequest.countryId(), attractionRequest.regionId(), attractionRequest.cityId(), attractionRequest.mainAttractionId(), attractionRequest.toAttraction());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(attraction.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

}
