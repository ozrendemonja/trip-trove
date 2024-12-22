package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface CountryService {
    String saveCountry(String continentName, String countryName);

    List<Country> getAllCountries(SortDirection sortDirection);
}
