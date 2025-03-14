package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

import static com.triptrove.manager.domain.repo.AttractionSpecifications.*;

@Service
@AllArgsConstructor
@Log4j2
public class SearchServiceImpl implements SearchService {
    private final ManagerProperties managerProperties;
    private final ContinentRepo continentRepo;
    private final CountryRepo countryRepo;
    private final RegionRepo regionRepo;
    private final CityRepo cityRepo;
    private final AttractionRepo attractionRepo;

    @Override
    public List<Suggestion> suggestNames(String query, SearchInElement searchIn, Integer countryId) {
        log.atInfo().log("Search using query '{}'", query);
        List<Suggestion> result = Collections.emptyList();
        String foundMessage = "Found '{}' names";
        if (searchIn.equals(SearchInElement.COUNTRY)) {
            log.atInfo().log("Search for a country name");
            result = countryRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, Limit.of(managerProperties.suggestionLimit()));
            log.atInfo().log(foundMessage, result.size());
        } else if (searchIn.equals(SearchInElement.CONTINENT)) {
            log.atInfo().log("Search for a continent name");
            result = continentRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, Limit.of(managerProperties.suggestionLimit()));
            log.atInfo().log("Found '{}' names", result.size());
        } else if (searchIn.equals(SearchInElement.REGION)) {
            if (countryId == null) {
                log.atInfo().log("Search for a region name");
                result = regionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            } else {
                log.atInfo().log("Search for a region name under given country");
                result = regionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, countryId, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            }
        } else if (searchIn.equals(SearchInElement.CITY)) {
            if (countryId == null) {
                log.atInfo().log("Search for a city name");
                result = cityRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            } else {
                log.atInfo().log("Search for a city name under given country");
                result = cityRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, countryId, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            }
        } else if (searchIn.equals(SearchInElement.ATTRACTION)) {
            if (countryId == null) {
                log.atInfo().log("Search for a attraction name");
                result = attractionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            } else {
                log.atInfo().log("Search for a attraction name under given country");
                result = attractionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, countryId, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            }
        } else if (searchIn.equals(SearchInElement.MAIN_ATTRACTION)) {
            if (countryId == null) {
                log.atInfo().log("Search for a main attraction name");
                result = attractionRepo.findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            } else {
                log.atInfo().log("Search for a main attraction name under given country");
                result = attractionRepo.findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(query, countryId, Limit.of(managerProperties.suggestionLimit()));
                log.atInfo().log(foundMessage, result.size());
            }
        }
        return result;
    }

    @Override
    public List<Attraction> getAllAttractionsUnderContinent(String name, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        log.atInfo().log("Search for attractions under continent");
        Specification<Attraction> filterCriteria = newestAttractionsUnderContinent(name).and(applyFilters(attractionFilter));

        return getFilteredAttractions(filterCriteria, beforeAttraction);
    }

    @Override
    public List<Attraction> getAllAttractionsUnderCountry(Integer countryId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderCountry(countryId).and(applyFilters(attractionFilter));

        return getFilteredAttractions(filterCriteria, beforeAttraction);
    }

    @Override
    public List<Attraction> getAllAttractionsUnderRegion(Integer regionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderRegion(regionId).and(applyFilters(attractionFilter));

        return getFilteredAttractions(filterCriteria, beforeAttraction);
    }

    @Override
    public List<Attraction> getAllAttractionsUnderCity(Integer cityId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderCity(cityId).and(applyFilters(attractionFilter));

        return getFilteredAttractions(filterCriteria, beforeAttraction);
    }

    @Override
    public List<Attraction> getAllAttractionsUnderMainAttraction(Long attractionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderMainAttraction(attractionId).and(applyFilters(attractionFilter));

        return getFilteredAttractions(filterCriteria, beforeAttraction);
    }

    private List<Attraction> getFilteredAttractions(Specification<Attraction> attractions, ScrollPosition beforeAttraction) {

        if (beforeAttraction != null) {
            log.atInfo().log("Getting a list of newest attractions, updated before {} which meets criteria", beforeAttraction.updatedOn());
            List<Attraction> result = attractionRepo.findAll(attractions.and(isBefore(beforeAttraction)), PageRequest.of(0, managerProperties.pageSize())).getContent();
            log.atInfo().log("Found {} attractions which meets criteria", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of first {} newest attractions which meets criteria", managerProperties.pageSize());
        List<Attraction> result = attractionRepo.findAll(attractions, PageRequest.of(0, managerProperties.pageSize())).getContent();
        log.atInfo().log("Found {} attractions which meets criteria", result.size());
        return result;
    }
}
