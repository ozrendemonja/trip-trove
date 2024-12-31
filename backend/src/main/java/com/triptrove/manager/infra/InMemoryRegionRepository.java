package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.repo.RegionRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
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

    @Override
    public List<Region> findTopOldest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(region -> region.getUpdatedOn().orElse(region.getCreatedOn())))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Region> findTopNewest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(region -> region.getUpdatedOn().orElse(region.getCreatedOn()), Comparator.reverseOrder()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Region> findNextOldest(int pageSize, ScrollPosition afterRegion) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(region -> region.getUpdatedOn().orElse(region.getCreatedOn())))
                .dropWhile(region -> region.getId() <= afterRegion.elementId() || region.getUpdatedOn().orElse(region.getCreatedOn()).isBefore(afterRegion.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Region> findNextNewest(int pageSize, ScrollPosition afterRegion) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn()), Comparator.reverseOrder()))
                .dropWhile(country -> country.getId() >= afterRegion.elementId() || country.getUpdatedOn().orElse(country.getCreatedOn()).isAfter(afterRegion.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public void deleteById(int id) {
        inMemoryDb.remove(id);
    }

    @Override
    public List<Region> findAll() {
        return inMemoryDb.values().stream().toList();
    }

    @Override
    public Optional<Region> findById(int id) {
        return inMemoryDb.values()
                .stream()
                .filter(country -> country.getId().equals(id))
                .findAny();
    }

}
