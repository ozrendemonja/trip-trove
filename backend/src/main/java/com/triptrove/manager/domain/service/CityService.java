package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface CityService {
    City saveCity(String name, int regionId);

    List<City> getCities(SortDirection sortDirection);

    List<City> getCities(ScrollPosition afterCity, SortDirection sortDirection);

    void deleteCity(int id);

    City getCity(int id);

    void updateCityDetails(int id, String newCityName);

    void updateCityRegionDetails(int id, Integer regionId);
}
