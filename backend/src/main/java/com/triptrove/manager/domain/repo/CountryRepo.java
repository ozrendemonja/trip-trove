package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.CountryScrollPosition;

import java.util.List;
import java.util.Optional;

public interface CountryRepo {
    Country save(Country country);

    List<Country> findAll();

    Optional<Country> findByName(String name);

    List<Country> findNextOldest(int pageSize, CountryScrollPosition afterCountry);

    List<Country> findNextNewest(int pageSize, CountryScrollPosition afterCountry);

    List<Country> findTopNewest(int pageSize);

    List<Country> findTopOldest(int pageSize);

    Optional<Country> findByNameAndContinentName(String countryName, String continentName);
}
