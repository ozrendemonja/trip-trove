package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;

import java.util.List;

public interface SearchService {
    List<Suggestion> suggestNames(String query, SearchInElement searchIn, Integer countryId);

    List<AttractionOverview> getAllAttractionsUnderContinent(String name, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionOverview> getAllAttractionsUnderCountry(Integer countryId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionOverview> getAllAttractionsUnderRegion(Integer regionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionOverview> getAllAttractionsUnderCity(Integer cityId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionOverview> getAllAttractionsUnderMainAttraction(Long attractionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);
}
