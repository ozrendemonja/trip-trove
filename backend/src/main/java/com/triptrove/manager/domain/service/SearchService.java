package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;

import java.util.List;

public interface SearchService {
    List<Suggestion> suggestNames(String query, SearchInElement searchIn, Integer countryId);

    List<Attraction> getAllAttractionsUnderContinent(String name, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<Attraction> getAllAttractionsUnderCountry(Integer countryId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<Attraction> getAllAttractionsUnderRegion(Integer regionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<Attraction> getAllAttractionsUnderCity(Integer cityId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<Attraction> getAllAttractionsUnderMainAttraction(Long attractionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);
}
