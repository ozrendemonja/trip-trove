package com.triptrove.manager;

import com.triptrove.manager.application.dto.search.StrategyApiType;
import com.triptrove.manager.application.dto.search.SuggestionDto;

public class SuggestionDtoFactory {
    private static final StrategyApiType strategyType = StrategyApiType.RANK;

    public static SuggestionDto createSuggestionDto(String value, Integer id) {
        return new SuggestionDto(value, id, strategyType);
    }
}
