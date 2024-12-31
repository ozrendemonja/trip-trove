package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface CountryService {
    Country saveCountry(String continentName, String countryName);

    List<Country> getCountries(ScrollPosition afterCountry, SortDirection sortDirection);

    List<Country> getCountries(SortDirection sortDirection);

    void deleteCountry(Integer id);

    void updateCountryDetails(Integer id, String name);

    void updateCountryContinentDetails(Integer countryId, String continentName);

    Country getCountry(Integer id);
}
