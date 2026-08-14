package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.ContinentName;
import com.triptrove.manager.domain.CountryName;
import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode;

@Service
@AllArgsConstructor
@Log4j2
public class CountryServiceImpl implements CountryService {
    private final CountryRepo countryRepo;
    private final ContinentRepo continentRepo;
    private final ManagerProperties managerProperties;

    @Override
    public Country saveCountry(ContinentName continentName, CountryName countryName, String isoCode) {
        log.atInfo().log("Processing save country request for country '{}'", countryName.name());
        if (countryRepo.isNameAlreadyUsedInContinent(countryName, continentName)) {
            throw new BaseApiException("Country '%s' in '%s' already exists in the database.".formatted(countryName.name(), continentName.name()), ErrorCode.DUPLICATE_NAME);
        }
        log.atInfo().log("Given country name is unique");

        String normalizedIsoCode = isoCode.toLowerCase(Locale.ROOT);
        if (countryRepo.isIsoCodeAlreadyUsed(normalizedIsoCode)) {
            throw new BaseApiException("Country ISO code '%s' already exists in the database.".formatted(isoCode), ErrorCode.DUPLICATE_ISO_CODE);
        }

        var storedContinent = continentRepo.findByName(continentName.name())
            .orElseThrow(() -> new BaseApiException("Continent name '%s' not found in the database".formatted(continentName.name()), ErrorCode.OBJECT_NOT_FOUND));

        var countryEntity = new Country();
        countryEntity.setName(countryName.name());
        countryEntity.setIsoCode(normalizedIsoCode);
        countryEntity.setContinent(storedContinent);
        var result = countryRepo.save(countryEntity);

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
        if (countryRepo.hasRegionsUnder(id)) {
            throw new BaseApiException("Country has regions under", ErrorCode.HAS_CHILDREN);
        }

        var country = countryRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));
        countryRepo.delete(country);
        log.atInfo().log("Country deleted");
    }

    @Override
    public void updateCountryDetails(Integer id, CountryName updatedCountryName) {
        String name = updatedCountryName.name();
        log.atInfo().log("Updating the country name to '{}'", name);

        var countryEntity = countryRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));

        var continentName = new ContinentName(countryEntity.getContinent().getName());
        if (countryRepo.isNameAlreadyUsedInContinent(updatedCountryName, continentName, countryEntity.getId())) {
            throw new BaseApiException("Country '%s' in '%s' already exists in the database.".formatted(name, continentName.name()), ErrorCode.DUPLICATE_NAME);
        }

        countryEntity.setName(name);
        countryRepo.save(countryEntity);
        log.atInfo().log("Country name has been updated to '{}'", name);
    }

    @Override
    public void updateCountryContinentDetails(Integer countryId, ContinentName continentName) {
        log.atInfo().log("Updating the country to belong to the '{}' continent", continentName.name());
        var newContinent = continentRepo.findByName(continentName.name())
                .orElseThrow(() -> new BaseApiException("Continent name '%s' not found in the database".formatted(continentName.name()), ErrorCode.OBJECT_NOT_FOUND));
        var countryEntity = countryRepo.findById(countryId)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));

        var countryName = new CountryName(countryEntity.getName());
        if (countryRepo.isNameAlreadyUsedInContinent(countryName, continentName, countryEntity.getId())) {
            throw new BaseApiException("Cannot change the country to '%s' as it already exists in the database".formatted(continentName.name()), ErrorCode.DUPLICATE_NAME);
        }
        countryEntity.setContinent(newContinent);

        countryRepo.save(countryEntity);
        log.atInfo().log("Updated the country to belong to the '{}' continent", continentName.name());
    }

    @Override
    public Country getCountry(Integer id) {
        log.atInfo().log("Getting country with id '{}'", id);
        return countryRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));
    }

    @Override
    public void updateCountryIsoCode(Integer countryId, String isoCode) {
        log.atInfo().log("Updating ISO code for country '{}' to '{}'", countryId, isoCode);
        var country = countryRepo.findById(countryId)
                .orElseThrow(() -> new BaseApiException("Country not found in the database", ErrorCode.OBJECT_NOT_FOUND));
        if (countryRepo.isIsoCodeAlreadyUsed(isoCode, countryId)) {
            throw new BaseApiException("Country ISO code '%s' already exists in the database.".formatted(isoCode), ErrorCode.DUPLICATE_ISO_CODE);
        }
        country.setIsoCode(isoCode.toLowerCase(Locale.ROOT));
        countryRepo.save(country);
        log.atInfo().log("ISO code updated for country '{}'", countryId);
    }
}
