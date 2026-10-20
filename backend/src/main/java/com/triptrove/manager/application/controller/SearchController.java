package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.AttractionCategoryDTO;
import com.triptrove.manager.application.dto.AttractionParameter;
import com.triptrove.manager.application.dto.AttractionTypeDTO;
import com.triptrove.manager.application.dto.GetSearchAttractionResponse;
import com.triptrove.manager.application.dto.error.ErrorResponse;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.SearchIn;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.model.AttractionFilter;
import com.triptrove.manager.domain.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping(path = "/search", headers = "x-api-version=1")
@AllArgsConstructor
@Tag(name = "Search")
public class SearchController {
    private final SearchService searchService;

    @GetMapping()
    @Operation(summary = "Get name suggestions based on the query in a group, sorted by last updated time or creation time if never updated ",
            parameters = {
                    @Parameter(name = "q", description = "Parameter used for search. Query string must be at least 3 characters long"),
                    @Parameter(name = "i", description = "Parameter used to select the group of elements for the search"),
                    @Parameter(name = "cid", description = "Parameter used to specifies the country for the search. It is not used when searching for a country or continent.")
            })
    public GetSearchResponse getSearchedElements(@RequestParam(name = "q") @NotBlank @Size(min = 3, message = "Query string must be at least {min} characters long") String query,
                                                 @RequestParam(name = "i") SearchIn searchIn,
                                                 @RequestParam(name = "cid", required = false) Integer countryId
    ) {
        var result = searchService.suggestNames(query, searchIn.toSearchInElement(), countryId)
                .stream()
                .map(element -> new SuggestionDto(element.value(), element.id(), StrategyApiType.RANK))
                .toList();
        return new GetSearchResponse(query, result);
    }

    @GetMapping("continent/{name}/attractions")
    @Operation(summary = "List attractions under the given continent in descending last modification time (creation time if never modified), then identifier order. Filters apply before pagination.",
            parameters = {
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            }, responses = {
                    @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetSearchAttractionResponse.class)))),
                    @ApiResponse(responseCode = "400", description = "Invalid cursor or search filters",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<GetSearchAttractionResponse> getContinentAttractions(@PathVariable String name,
                                                               @Valid @ParameterObject AttractionParameter after,
                                                               @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                               @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                               @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                               @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                               @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                               @RequestParam(name = "q", required = false) @Pattern(regexp = "^(?!\\s*$).+", message = "Query string must not be blank") @Size(min = 3, message = "Query string must be at least {min} characters long") String query
    ) {
        var afterAttraction = after.toScrollPosition();
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderContinent(name, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetSearchAttractionResponse::from)
                .toList();
    }

    @GetMapping("country/{countryId}/attractions")
    @Operation(summary = "List attractions under the given country in descending last modification time (creation time if never modified), then identifier order. Filters apply before pagination.",
            parameters = {
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            }, responses = {
                    @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetSearchAttractionResponse.class)))),
                    @ApiResponse(responseCode = "400", description = "Invalid cursor or search filters",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<GetSearchAttractionResponse> getCountryAttractions(@PathVariable Integer countryId,
                                                             @Valid @ParameterObject AttractionParameter after,
                                                             @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                             @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                             @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                             @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                             @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                             @RequestParam(name = "q", required = false) @Pattern(regexp = "^(?!\\s*$).+", message = "Query string must not be blank") @Size(min = 3, message = "Query string must be at least {min} characters long") String query
    ) {
        var afterAttraction = after.toScrollPosition();
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderCountry(countryId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetSearchAttractionResponse::from)
                .toList();
    }

    @GetMapping("region/{regionId}/attractions")
    @Operation(summary = "List attractions under the given region in descending last modification time (creation time if never modified), then identifier order. Filters apply before pagination.",
            parameters = {
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            }, responses = {
                    @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetSearchAttractionResponse.class)))),
                    @ApiResponse(responseCode = "400", description = "Invalid cursor or search filters",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<GetSearchAttractionResponse> getRegionAttractions(@PathVariable Integer regionId,
                                                            @Valid @ParameterObject AttractionParameter after,
                                                            @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                            @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                            @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                            @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                            @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                            @RequestParam(name = "q", required = false) @Pattern(regexp = "^(?!\\s*$).+", message = "Query string must not be blank") @Size(min = 3, message = "Query string must be at least {min} characters long") String query
    ) {
        var afterAttraction = after.toScrollPosition();
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderRegion(regionId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetSearchAttractionResponse::from)
                .toList();
    }

    @GetMapping("city/{cityId}/attractions")
    @Operation(summary = "List attractions under the given city in descending last modification time (creation time if never modified), then identifier order. Filters apply before pagination.",
            parameters = {
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            }, responses = {
                    @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetSearchAttractionResponse.class)))),
                    @ApiResponse(responseCode = "400", description = "Invalid cursor or search filters",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<GetSearchAttractionResponse> getCityAttractions(@PathVariable Integer cityId,
                                                          @Valid @ParameterObject AttractionParameter after,
                                                          @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                          @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                          @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                          @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                          @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                          @RequestParam(name = "q", required = false) @Pattern(regexp = "^(?!\\s*$).+", message = "Query string must not be blank") @Size(min = 3, message = "Query string must be at least {min} characters long") String query
    ) {
        var afterAttraction = after.toScrollPosition();
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderCity(cityId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetSearchAttractionResponse::from)
                .toList();
    }

    @GetMapping("attraction/{mainAttractionId}/attractions")
    @Operation(summary = "List direct children of the given main attraction in descending last modification time (creation time if never modified), then identifier order. Filters apply before pagination.",
            parameters = {
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            }, responses = {
                    @ApiResponse(responseCode = "200", description = "Content page; an empty array ends traversal",
                            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = GetSearchAttractionResponse.class)))),
                    @ApiResponse(responseCode = "400", description = "Invalid cursor or search filters",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<GetSearchAttractionResponse> getMainAttractionAttractions(@PathVariable Long mainAttractionId,
                                                                    @Valid @ParameterObject AttractionParameter after,
                                                                    @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                                    @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                                    @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                                    @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                                    @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                                    @RequestParam(name = "q", required = false) @Pattern(regexp = "^(?!\\s*$).+", message = "Query string must not be blank") @Size(min = 3, message = "Query string must be at least {min} characters long") String query
    ) {
        var afterAttraction = after.toScrollPosition();
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderMainAttraction(mainAttractionId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetSearchAttractionResponse::from)
                .toList();
    }

}