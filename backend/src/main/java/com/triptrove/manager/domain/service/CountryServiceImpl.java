package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
@Log4j2
public class CountryServiceImpl implements CountryService {
    private final CountryRepo countryRepo;
    private final ContinentRepo continentRepo;
    private final ManagerProperties managerProperties;

    @Override
    public Country saveCountry(String continentName, String countryName) {
        log.atInfo().log("Processing save country request for country '{}'", countryName);
        if (countryRepo.findByNameAndContinentName(countryName, continentName).isPresent()) {
            log.atInfo().log("Country '{}' in '{}' already exists in the database.", countryName, continentName);
            throw new DuplicateNameException();
        }
        var continent = continentRepo.findByName(continentName);
        if (continent.isEmpty()) {
            log.atInfo().log("Continent name '{}' not found in the database", continentName);
            throw new ObjectNotFoundException();
        }
        var country = new Country();
        country.setName(countryName);
        country.setContinent(continent.get());

        var result = countryRepo.save(country);

        log.atInfo().log("Country '{}' successfully saved", result.getName());

        return result;
    }

    @Override
    public List<Country> getCountries(CountryScrollPosition afterCountry, SortDirection sortDirection) {
        log.atInfo().log("Getting a list of countries ordered in {} order, updated before {}", sortDirection, afterCountry.updatedOn());

        if (sortDirection == SortDirection.ASCENDING) {
            return countryRepo.findNextOldest(managerProperties.pageSize(), afterCountry);
        }
        return countryRepo.findNextNewest(managerProperties.pageSize(), afterCountry);
    }

    @Override
    public List<Country> getCountries(SortDirection sortDirection) {
        log.atInfo().log("Getting the first page of countries, ordered in {} order", sortDirection);

        if (sortDirection == SortDirection.ASCENDING) {
            return countryRepo.findTopOldest(managerProperties.pageSize());
        }
        return countryRepo.findTopNewest(managerProperties.pageSize());
    }

    @Override
    public void deleteCountry(Integer id) {
        log.atInfo().log("Deleting country");
        countryRepo.deleteById(id);
        log.atInfo().log("Country deleted");
    }
}
