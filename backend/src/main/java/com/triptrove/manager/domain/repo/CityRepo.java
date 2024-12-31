package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;

import java.util.List;
import java.util.Optional;

public interface CityRepo {
    City save(City city);

    Optional<City> findByNameAndRegionId(String name, int regionId);

    List<City> findByName(String name);

    List<City> findTopOldest(int pageSize);

    List<City> findTopNewest(int pageSize);

    List<City> findNextOldest(int pageSize, ScrollPosition afterCity);

    List<City> findNextNewest(int pageSize, ScrollPosition afterCity);

    Optional<City> findById(int id);

    void delete(City city);

    List<City> findAll();

    List<Suggestion> search(String query, int limit);
}
