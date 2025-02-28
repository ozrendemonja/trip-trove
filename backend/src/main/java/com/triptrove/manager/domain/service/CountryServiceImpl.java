package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode;

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
        if (countryRepo.existsByNameAndContinentName(countryName, continentName)) {
            throw new BaseApiException("Country '%s' in '%s' already exists in the database.".formatted(countryName, continentName), ErrorCode.DUPLICATE_NAME);
        }
        log.atInfo().log("Given country name is unique");

        var continent = continentRepo.findByName(continentName).orElseThrow(() -> new BaseApiException("Continent name '%s' not found in the database".formatted(continentName), ErrorCode.OBJECT_NOT_FOUND));

        var country = new Country();
        country.setName(countryName);
        country.setContinent(continent);
        var result = countryRepo.save(country);

        log.atInfo().log("Country '{}' successfully saved", result.getName());

        return result;
    }

    @Override
    public List<Country> getCountries(ScrollPosition country, SortDirection sortDirection) {
        if (sortDirection == SortDirection.ASCENDING) {
            return getCountriesAfter(country);
        }
        return getCountriesBefore(country);
    }

    private List<Country> getCountriesAfter(ScrollPosition country) {
        if (country == null) {
            log.atInfo().log("Getting a list of first {} oldest countries", managerProperties.pageSize());
            List<Country> result = countryRepo.findAllOrderByOldest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} countries", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of oldest countries, updated after {}", country.updatedOn());
        List<Country> result = countryRepo.findOldestAfter(country, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} countries", result.size());
        return result;
    }

    private List<Country> getCountriesBefore(ScrollPosition country) {
        if (country == null) {
            log.atInfo().log("Getting a list of first {} newest countries", managerProperties.pageSize());
            List<Country> result = countryRepo.findAllOrderByNewest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} countries", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of newest countries, updated before {}", country.updatedOn());
        List<Country> result = countryRepo.findNewestBefore(country, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} countries", result.size());
        return result;
    }

    @Override
    public void deleteCountry(Integer id) {
        log.atInfo().log("Deleting country");
        countryRepo.deleteById(id);
        log.atInfo().log("Country deleted");
    }

    @Override
    public void updateCountryDetails(Integer id, String name) {
        log.atInfo().log("Updating the country name to '{}'", name);

        var country = countryRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));

        if (countryRepo.existsByNameAndContinentName(name, country.getContinent().getName())) {
            throw new BaseApiException("Country '%s' in '%s' already exists in the database.".formatted(name, country.getContinent().getName()), ErrorCode.DUPLICATE_NAME);
        }

        country.setName(name);
        countryRepo.save(country);
        log.atInfo().log("Country name has been updated to '{}'", name);
    }

    @Override
    public void updateCountryContinentDetails(Integer countryId, String continentName) {
        log.atInfo().log("Updating the country to belong to the '{}' continent", continentName);
        Continent newContinent = continentRepo.findByName(continentName)
                .orElseThrow(() -> new BaseApiException("Continent name '%s' not found in the database".formatted(continentName), ErrorCode.OBJECT_NOT_FOUND));
        Country country = countryRepo.findById(countryId)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));

        if (countryRepo.existsByNameAndContinentName(country.getName(), continentName)) {
            throw new BaseApiException("Cannot change the country to '%s' as it already exists in the database".formatted(continentName), ErrorCode.DUPLICATE_NAME);
        }
        country.setContinent(newContinent);

        countryRepo.save(country);
        log.atInfo().log("Updated the country to belong to the '{}' continent", continentName);
    }

    @Override
    public Country getCountry(Integer id) {
        log.atInfo().log("Getting country with id '{}'", id);
        return countryRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));
    }
}
