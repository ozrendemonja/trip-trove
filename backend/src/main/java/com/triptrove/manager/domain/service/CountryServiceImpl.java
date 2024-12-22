package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.model.ObjectNotFoundException;
import com.triptrove.manager.domain.repo.ContinentRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Log4j2
public class CountryServiceImpl implements CountryService {
    private final CountryRepo countryRepo;
    private final ContinentRepo continentRepo;

    @Override
    public String saveCountry(String continentName, String countryName) {
        log.atInfo().log("Processing save country request for country '{}'", countryName);
        if (countryRepo.findByName(countryName).isPresent()) {
            log.atInfo().log("Country already exists in the database");
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

        return result.getName();
    }
}
