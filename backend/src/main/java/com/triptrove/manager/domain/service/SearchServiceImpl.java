package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.*;
import com.triptrove.manager.domain.search.SearchTextNormalizer;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final InformationProviderRepo informationProviderRepo;
    private final TripAttractionRepo tripAttractionRepo;

    @Override
    public List<Suggestion> suggestNames(String query, SearchInElement searchIn, Integer countryId) {
        log.atInfo().log("Search using query '{}'", query);
        String normalizedQuery = SearchTextNormalizer.normalizeForSearch(query);
        var limit = Limit.of(managerProperties.suggestionLimit());
        List<Suggestion> result = switch (searchIn) {
            case COUNTRY -> {
                log.atInfo().log("Search for a country name");
                yield countryRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
            }
            case CONTINENT -> {
                log.atInfo().log("Search for a continent name");
                yield continentRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
            }
            case REGION -> {
                if (countryId == null) {
                    log.atInfo().log("Search for a region name");
                    yield regionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
                }
                log.atInfo().log("Search for a region name under given country");
                yield regionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, countryId, limit);
            }
            case CITY -> {
                if (countryId == null) {
                    log.atInfo().log("Search for a city name");
                    yield cityRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
                }
                log.atInfo().log("Search for a city name under given country");
                yield cityRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, countryId, limit);
            }
            case ATTRACTION -> {
                if (countryId == null) {
                    log.atInfo().log("Search for an attraction name");
                    yield attractionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
                }
                log.atInfo().log("Search for an attraction name under given country");
                yield attractionRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, countryId, limit);
            }
            case MAIN_ATTRACTION -> {
                if (countryId == null) {
                    log.atInfo().log("Search for a main attraction name");
                    yield attractionRepo.findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
                }
                log.atInfo().log("Search for a main attraction name under given country");
                yield attractionRepo.findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, countryId, limit);
            }
            case INFORMATION_PROVIDER -> {
                log.atInfo().log("Search for an information provider name");
                yield informationProviderRepo.findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(normalizedQuery, limit);
            }
        };
        log.atInfo().log("Found '{}' names", result.size());
        return result;
    }

    @Override
    public List<AttractionWithVisitStatus> getAllAttractionsUnderContinent(String name, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        log.atInfo().log("Search for attractions under continent");
        Specification<Attraction> filterCriteria = newestAttractionsUnderContinent(name).and(applyFilters(attractionFilter));

        return withVisitStatuses(getFilteredAttractions(filterCriteria, beforeAttraction));
    }

    @Override
    public List<AttractionWithVisitStatus> getAllAttractionsUnderCountry(Integer countryId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderCountry(countryId).and(applyFilters(attractionFilter));

        return withVisitStatuses(getFilteredAttractions(filterCriteria, beforeAttraction));
    }

    @Override
    public List<AttractionWithVisitStatus> getAllAttractionsUnderRegion(Integer regionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderRegion(regionId).and(applyFilters(attractionFilter));

        return withVisitStatuses(getFilteredAttractions(filterCriteria, beforeAttraction));
    }

    @Override
    public List<AttractionWithVisitStatus> getAllAttractionsUnderCity(Integer cityId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderCity(cityId).and(applyFilters(attractionFilter));

        return withVisitStatuses(getFilteredAttractions(filterCriteria, beforeAttraction));
    }

    @Override
    public List<AttractionWithVisitStatus> getAllAttractionsUnderMainAttraction(Long attractionId, ScrollPosition beforeAttraction, AttractionFilter attractionFilter) {
        Specification<Attraction> filterCriteria = newestAttractionsUnderMainAttraction(attractionId).and(applyFilters(attractionFilter));

        return withVisitStatuses(getFilteredAttractions(filterCriteria, beforeAttraction));
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

    private List<AttractionWithVisitStatus> withVisitStatuses(List<Attraction> attractions) {
        if (attractions.isEmpty()) {
            return List.of();
        }
        var attractionIds = attractions.stream().map(Attraction::getId).toList();
        Map<Long, AttractionVisitStatus> statuses = computeVisitStatuses(attractionIds);
        return attractions.stream()
                .map(attraction -> new AttractionWithVisitStatus(attraction, statuses.get(attraction.getId())))
                .toList();
    }

    private Map<Long, AttractionVisitStatus> computeVisitStatuses(List<Long> attractionIds) {
        if (attractionIds.isEmpty()) {
            return Map.of();
        }
        log.atInfo().log("Computing visit status for {} attractions", attractionIds.size());

        Map<Long, AttractionVisitStatus> statuses = attractionIds.stream()
                .collect(Collectors.toMap(attractionId -> attractionId, _attractionId -> AttractionVisitStatus.NOT_VISITED, (a, b) -> b));
        for (AttractionVisitFlag flag : tripAttractionRepo.findLatestVisitFlags(attractionIds)) {
            var status = flag.wouldVisitAgain()
                    ? AttractionVisitStatus.VISITED_WANT_RETURN
                    : AttractionVisitStatus.VISITED_DONE;
            statuses.put(flag.attractionId(), status);
        }
        return statuses;
    }
}
