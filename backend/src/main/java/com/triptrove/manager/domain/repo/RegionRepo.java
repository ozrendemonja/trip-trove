package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Region;

import java.util.List;
import java.util.Optional;

public interface RegionRepo {
    Region save(Region region);

    Optional<Region> findByNameAndCountryId(String name, int id);

    List<Region> findByName(String name);

}
