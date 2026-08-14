package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.ContinentName;
import com.triptrove.manager.domain.CountryName;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface CountryService {
    Country saveCountry(ContinentName continentName, CountryName countryName, String isoCode);

    List<Country> getCountries(ScrollPosition afterCountry, SortDirection sortDirection);

    void deleteCountry(Integer id);

    void updateCountryDetails(Integer id, CountryName countryName);

    void updateCountryContinentDetails(Integer countryId, ContinentName continentName);

    void updateCountryIsoCode(Integer countryId, String isoCode);

    Country getCountry(Integer id);
}
