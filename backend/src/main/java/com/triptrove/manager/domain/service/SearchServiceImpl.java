package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.SearchInElement;
import com.triptrove.manager.domain.model.Suggestion;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@AllArgsConstructor
@Log4j2
public class SearchServiceImpl implements SearchService {
    private final ManagerProperties properties;
    private final ContinentRepo continentRepo;
    private final CountryRepo countryRepo;
    private final RegionRepo regionRepo;
    private final CityRepo cityRepo;
    private final AttractionRepo attractionRepo;

    @Override
    public List<Suggestion> suggestNames(String query, SearchInElement searchIn) {
        log.atInfo().log("Search using query '{}'", query);
        List<Suggestion> result = Collections.emptyList();
        if (searchIn.equals(SearchInElement.COUNTRY)) {
            log.atInfo().log("Search for a country name");
            result = countryRepo.search(query, properties.suggestionLimit());
            log.atInfo().log("Found '{}' names", result.size());
        } else if (searchIn.equals(SearchInElement.CONTINENT)) {
            log.atInfo().log("Search for a continent name");
            result = continentRepo.search(query, properties.suggestionLimit());
            log.atInfo().log("Found '{}' names", result.size());
        } else if (searchIn.equals(SearchInElement.REGION)) {
            log.atInfo().log("Search for a region name");
            result = regionRepo.search(query, properties.suggestionLimit());
            log.atInfo().log("Found '{}' names", result.size());
        } else if (searchIn.equals(SearchInElement.CITY)) {
            log.atInfo().log("Search for a city name");
            result = cityRepo.search(query, properties.suggestionLimit());
            log.atInfo().log("Found '{}' names", result.size());
        } else if (searchIn.equals(SearchInElement.ATTRACTION)) {
            log.atInfo().log("Search for a attraction name");
            result = attractionRepo.search(query, properties.suggestionLimit());
            log.atInfo().log("Found '{}' names", result.size());
        }
        return result;
    }
}
