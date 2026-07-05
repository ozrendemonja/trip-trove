package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;

import java.util.List;

public interface SearchService {
    List<Suggestion> suggestNames(String query, SearchInElement searchIn, Integer countryId);

    List<AttractionWithVisitStatus> getAllAttractionsUnderContinent(String name, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionWithVisitStatus> getAllAttractionsUnderCountry(Integer countryId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionWithVisitStatus> getAllAttractionsUnderRegion(Integer regionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionWithVisitStatus> getAllAttractionsUnderCity(Integer cityId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);

    List<AttractionWithVisitStatus> getAllAttractionsUnderMainAttraction(Long attractionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter);
}
