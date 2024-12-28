package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.CountryScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;

import java.util.List;
import java.util.Optional;

public interface CountryRepo {
    Country save(Country country);

    List<Country> findAll();

    List<Country> findByName(String name);

    List<Country> findNextOldest(int pageSize, CountryScrollPosition afterCountry);

    List<Country> findNextNewest(int pageSize, CountryScrollPosition afterCountry);

    List<Country> findTopNewest(int pageSize);

    List<Country> findTopOldest(int pageSize);

    Optional<Country> findByNameAndContinentName(String countryName, String continentName);

    void deleteById(Integer id);

    Optional<Country> findById(Integer id);

    List<Suggestion> search(String query, int limit);
}
