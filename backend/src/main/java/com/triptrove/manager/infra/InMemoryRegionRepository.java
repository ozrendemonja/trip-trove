package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.repo.RegionRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class InMemoryRegionRepository implements RegionRepo {
    private final Map<Integer, Region> inMemoryDb;
    private static int rowNumber = 0;

    @Override
    public Region save(Region region) {
        if (region.getId() == null) {
            region.setId(rowNumber++);
        }
        inMemoryDb.put(region.getId(), region);
        return region;
    }

    @Override
    public Optional<Region> findByNameAndCountryId(String name, int id) {
        return findByName(name).stream()
                .filter(region -> region.getCountry().getId().equals(id))
                .findAny();
    }

    @Override
    public List<Region> findByName(String name) {
        return inMemoryDb.values()
                .stream()
                .filter(region -> region.getName().equals(name))
                .toList();
    }
}
