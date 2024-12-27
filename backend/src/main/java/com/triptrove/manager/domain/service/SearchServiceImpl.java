package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.SearchInElement;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@AllArgsConstructor
@Log4j2
public class SearchServiceImpl implements SearchService {
    private final ContinentRepo continentRepo;
    private final CountryRepo countryRepo;

    @Override
    public List<String> suggestNames(String query, SearchInElement searchIn) {
        log.atInfo().log("Search using query '{}'", query);
        List<String> result = Collections.emptyList();
        if (searchIn.equals(SearchInElement.COUNTRY)) {
            log.atInfo().log("Search for a country name");
            result = countryRepo.search(query);
            log.atInfo().log("Found '{}' names", result.size());
        }
        return result;
    }
}
