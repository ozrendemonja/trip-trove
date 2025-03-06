package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.AttractionCategoryDTO;
import com.triptrove.manager.application.dto.AttractionParameter;
import com.triptrove.manager.application.dto.AttractionTypeDTO;
import com.triptrove.manager.application.dto.GetAttractionResponse;
import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.SearchIn;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.model.AttractionFilter;
import com.triptrove.manager.domain.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
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
                    @Parameter(name = "i", description = "Parameter used to select the group of elements for the search")
            })
    public GetSearchResponse getSearchedElements(@RequestParam(name = "q") @NotBlank @Size(min = 3, message = "Query string must be at least {min} characters long") String query, @RequestParam(name = "i") SearchIn searchIn) {
        var result = searchService.suggestNames(query, searchIn.toSearchInElement())
                .stream()
                .map(element -> new SuggestionDto(element.value(), element.id(), StrategyApiType.RANK))
                .toList();
        return new GetSearchResponse(query, result);
    }

    @GetMapping("continent/{name}/attractions")
    @Operation(summary = "Get list of attractions under given continent, sorted by last updated time or creation time if never updated ",
            parameters = {
                    @Parameter(name = "after", description = "Last attraction retrieved on the previous page. Leave empty if this is the first page."),
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            })
    public List<GetAttractionResponse> getContinentAttractions(@PathVariable String name,
                                                               AttractionParameter after,
                                                               @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                               @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                               @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                               @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                               @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                               @RequestParam(name = "q", required = false) String query
    ) {
        var afterAttraction = after.attractionId() != null ? after.toScrollPosition() : null;
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderContinent(name, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetAttractionResponse::from)
                .toList();
    }

    @GetMapping("country/{countryId}/attractions")
    @Operation(summary = "Get list of attractions under given country, sorted by last updated time or creation time if never updated ",
            parameters = {
                    @Parameter(name = "after", description = "Last attraction retrieved on the previous page. Leave empty if this is the first page."),
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            })
    public List<GetAttractionResponse> getCountryAttractions(@PathVariable Integer countryId,
                                                             AttractionParameter after,
                                                             @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                             @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                             @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                             @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                             @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                             @RequestParam(name = "q", required = false) String query
    ) {
        var afterAttraction = after.attractionId() != null ? after.toScrollPosition() : null;
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderCountry(countryId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetAttractionResponse::from)
                .toList();
    }

    @GetMapping("region/{regionId}/attractions")
    @Operation(summary = "Get list of attractions under given country, sorted by last updated time or creation time if never updated ",
            parameters = {
                    @Parameter(name = "after", description = "Last attraction retrieved on the previous page. Leave empty if this is the first page."),
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            })
    public List<GetAttractionResponse> getRegionAttractions(@PathVariable Integer regionId,
                                                            AttractionParameter after,
                                                            @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                            @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                            @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                            @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                            @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                            @RequestParam(name = "q", required = false) String query
    ) {
        var afterAttraction = after.attractionId() != null ? after.toScrollPosition() : null;
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderRegion(regionId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetAttractionResponse::from)
                .toList();
    }

    @GetMapping("city/{cityId}/attractions")
    @Operation(summary = "Get list of attractions under given country, sorted by last updated time or creation time if never updated ",
            parameters = {
                    @Parameter(name = "after", description = "Last attraction retrieved on the previous page. Leave empty if this is the first page."),
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            })
    public List<GetAttractionResponse> getCityAttractions(@PathVariable Integer cityId,
                                                          AttractionParameter after,
                                                          @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                          @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                          @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                          @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                          @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                          @RequestParam(name = "q", required = false) String query
    ) {
        var afterAttraction = after.attractionId() != null ? after.toScrollPosition() : null;
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderCity(cityId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetAttractionResponse::from)
                .toList();
    }

    @GetMapping("attraction/{mainAttractionId}/attractions")
    @Operation(summary = "Get list of attractions under given main attraction, sorted by last updated time or creation time if never updated ",
            parameters = {
                    @Parameter(name = "after", description = "Last attraction retrieved on the previous page. Leave empty if this is the first page."),
                    @Parameter(name = "isCountrywide", description = "Filter attraction based on isCountrywide information."),
                    @Parameter(name = "category", description = "Filter attraction based on their category."),
                    @Parameter(name = "type", description = "Filter attraction based on their type."),
                    @Parameter(name = "mustVisit", description = "Filter attraction based on their mustVisit information."),
                    @Parameter(name = "isTraditional", description = "Filter attraction based on their isTraditional information."),
                    @Parameter(name = "q", description = "Filter attraction based on who provided information, name and tip.")
            })
    public List<GetAttractionResponse> getMainAttractionAttractions(@PathVariable Long mainAttractionId,
                                                                    AttractionParameter after,
                                                                    @RequestParam(name = "isCountrywide", required = false) Boolean isCountrywide,
                                                                    @RequestParam(name = "category", required = false) AttractionCategoryDTO category,
                                                                    @RequestParam(name = "type", required = false) AttractionTypeDTO type,
                                                                    @RequestParam(name = "mustVisit", required = false) Boolean mustVisit,
                                                                    @RequestParam(name = "isTraditional", required = false) Boolean isTraditional,
                                                                    @RequestParam(name = "q", required = false) String query
    ) {
        var afterAttraction = after.attractionId() != null ? after.toScrollPosition() : null;
        var categoryFilter = category != null ? category.toAttractionCategory() : null;
        var typeFilter = type != null ? type.toAttractionType() : null;
        return searchService.getAllAttractionsUnderMainAttraction(mainAttractionId, afterAttraction, new AttractionFilter(isCountrywide, categoryFilter, typeFilter, mustVisit, isTraditional, query))
                .stream()
                .map(GetAttractionResponse::from)
                .toList();
    }

}