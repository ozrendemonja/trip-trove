package com.triptrove.manager.application.controller;

import com.triptrove.manager.application.dto.search.GetSearchResponse;
import com.triptrove.manager.application.dto.search.SearchIn;
import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;
import com.triptrove.manager.domain.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
        List<SuggestionDto> result = searchService.suggestNames(query, searchIn.toSearchInElement())
                .stream()
                .map(name -> new SuggestionDto(name, StrategyApiType.RANK))
                .toList();
        return new GetSearchResponse(query, result);
    }

}
