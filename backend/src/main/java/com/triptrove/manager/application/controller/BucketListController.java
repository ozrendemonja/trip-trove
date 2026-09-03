package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.BucketListItemParameter;
import com.triptrove.manager.application.dto.CreateBucketListItemRequest;
import com.triptrove.manager.application.dto.GetBucketListItemResponse;
import com.triptrove.manager.application.dto.SortDirectionParameter;
import com.triptrove.manager.application.dto.UpdateBucketListItemCompletionRequest;
import com.triptrove.manager.application.dto.UpdateBucketListItemDescriptionRequest;
import com.triptrove.manager.application.dto.UpdateBucketListItemLocationRequest;
import com.triptrove.manager.application.dto.UpdateBucketListItemNameRequest;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.domain.service.BucketListService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(path = "/bucket-list/items", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "Bucket list")
public class BucketListController {
    private final BucketListService bucketListService;

    @PostMapping()
    @Operation(summary = "Save new bucket list item", responses = {
            @ApiResponse(description = "Bucket list item saved successfully", responseCode = "201"),
            @ApiResponse(description = "Invalid bucket list item data", responseCode = "400", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))}),
            @ApiResponse(description = "City or region not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public ResponseEntity<Void> saveItem(@RequestBody @Valid CreateBucketListItemRequest request) {
        var item = bucketListService.saveItem(
                request.name(), request.cityId(), request.regionId(), request.description());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(item.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @GetMapping
    @Operation(summary = "List paginable bucket list items, sorted by their last updated time. If an item was never updated, sort by its creation time. " +
            "Order by the given sort direction, or descending if none is provided.", parameters = {
            @Parameter(name = "sd", description = "Direction of ordering items using last updated time, or creation time if not updated."),
            @Parameter(name = "after", description = "Last item retrieved on the previous page. Leave empty if this is the first page.")
    })
    public List<GetBucketListItemResponse> getItems(
            @RequestParam(defaultValue = "DESC", name = "sd") SortDirectionParameter sortDirection,
            BucketListItemParameter after) {
        var afterItem = after.itemId() != null ? after.toScrollPosition() : null;
        return bucketListService.getItems(afterItem, sortDirection.toSortDirection()).stream()
                .map(GetBucketListItemResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve bucket list item by id", responses = {
            @ApiResponse(description = "Requested bucket list item", responseCode = "200"),
            @ApiResponse(description = "Bucket list item not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public GetBucketListItemResponse getItem(@PathVariable Long id) {
        return GetBucketListItemResponse.from(bucketListService.getItem(id));
    }

    @PutMapping("/{id:\\d+}/name")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Update bucket list item name", responses = {
            @ApiResponse(description = "Bucket list item name is updated", responseCode = "204"),
            @ApiResponse(description = "Invalid bucket list item name", responseCode = "400", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))}),
            @ApiResponse(description = "Bucket list item not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateItemName(
            @PathVariable Long id,
            @RequestBody @Valid UpdateBucketListItemNameRequest request) {
        bucketListService.updateItemName(id, request.name());
    }

    @PutMapping("/{id:\\d+}/location")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Update bucket list item location", responses = {
            @ApiResponse(description = "Bucket list item location is updated", responseCode = "204"),
            @ApiResponse(description = "Both city and region are provided", responseCode = "400", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))}),
            @ApiResponse(description = "Bucket list item, city or region not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateItemLocation(
            @PathVariable Long id,
            @RequestBody @Valid UpdateBucketListItemLocationRequest request) {
        bucketListService.updateItemLocation(id, request.cityId(), request.regionId());
    }

    @PutMapping("/{id:\\d+}/description")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Update bucket list item description", responses = {
            @ApiResponse(description = "Bucket list item description is updated", responseCode = "204"),
            @ApiResponse(description = "Invalid bucket list item description", responseCode = "400", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))}),
            @ApiResponse(description = "Bucket list item not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateItemDescription(
            @PathVariable Long id,
            @RequestBody @Valid UpdateBucketListItemDescriptionRequest request) {
        bucketListService.updateItemDescription(id, request.description());
    }

    @PutMapping("/{id:\\d+}/completion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Update bucket list item completion", responses = {
            @ApiResponse(description = "Bucket list item completion is updated", responseCode = "204"),
            @ApiResponse(description = "Invalid completion date or trip", responseCode = "400", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))}),
            @ApiResponse(description = "Bucket list item or trip not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void updateItemCompletion(
            @PathVariable Long id,
            @RequestBody @Valid UpdateBucketListItemCompletionRequest request) {
        bucketListService.updateItemCompletion(id, request.completedOn(), request.tripId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete bucket list item by its id", responses = {
            @ApiResponse(description = "Deleted bucket list item by its id", responseCode = "204"),
            @ApiResponse(description = "Bucket list item not found", responseCode = "404", content =
                    {@Content(mediaType = "application/json", schema =
                    @Schema(implementation = ErrorResponse.class))})
    })
    public void deleteItem(@PathVariable Long id) {
        bucketListService.deleteItem(id);
    }
}