package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.ScrollPosition;

import java.util.List;
import java.util.Optional;

public interface RegionRepo {
    Region save(Region region);

    Optional<Region> findByNameAndCountryId(String name, int id);

    List<Region> findByName(String name);

    List<Region> findTopOldest(int pageSize);

    List<Region> findTopNewest(int pageSize);

    List<Region> findNextOldest(int pageSize, ScrollPosition afterRegion);

    List<Region> findNextNewest(int pageSize, ScrollPosition afterRegion);

    void deleteById(int id);

    List<Region> findAll();

    Optional<Region> findById(int id);
}
