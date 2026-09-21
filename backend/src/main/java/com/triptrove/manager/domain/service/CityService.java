package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.CitySummary;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface CityService {
    City saveCity(String name, int regionId);

    List<CitySummary> getCities(ScrollPosition afterCity, SortDirection sortDirection);

    void deleteCity(int id);

    CitySummary getCity(int id);

    void updateCityDetails(int id, String newCityName);

    void updateCityRegionDetails(int id, Integer regionId);
}
