package com.triptrove.manager.application.dto.search;

import java.util.List;

public record GetSearchResponse(String prefix, List<SuggestionDto> suggestions) {
}
