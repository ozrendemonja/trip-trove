package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface CountryService {
    Country saveCountry(Continent continent, Country country, String isoCode);

    List<Country> getCountries(ScrollPosition afterCountry, SortDirection sortDirection);

    void deleteCountry(Integer id);

    void updateCountryDetails(Integer id, Country country);

    void updateCountryContinentDetails(Integer countryId, Continent continent);

    void updateCountryIsoCode(Integer countryId, String isoCode);

    Country getCountry(Integer id);
}
