package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.repo.CountryRepo;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Log4j2
public class CountryServiceImpl implements CountryService {
    private final CountryRepo countryRepo;

    @Override
    public String saveCountry(Country country) {
        log.atInfo().log("Processing save country request for '{}'", country.getName());
        if (countryRepo.findByName(country.getName()).isPresent()) {
            log.atInfo().log("Country already exists in the database");
            throw new DuplicateNameException();
        }
        var result = countryRepo.save(country);

        log.atInfo().log("Country '{}' successfully saved", result.getName());

        return result.getName();
    }
}
