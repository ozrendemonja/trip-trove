package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.repo.CityRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@AllArgsConstructor
@Repository
public class InMemoryCityRepository implements CityRepo {
    private final Map<Integer, City> inMemoryDb;
    private static int rowNumber = 0;

    @Override
    public City save(City city) {
        if (city.getId() == null) {
            city.setId(rowNumber++);
        }
        inMemoryDb.put(city.getId(), city);
        return city;
    }

    @Override
    public Optional<City> findByNameAndRegionId(String name, int regionId) {
        return findByName(name).stream()
                .filter(region -> region.getRegion().getId().equals(regionId))
                .findAny();
    }

    @Override
    public List<City> findByName(String name) {
        return inMemoryDb.values()
                .stream()
                .filter(city -> city.getName().equals(name))
                .toList();
    }

    @Override
    public List<City> findTopOldest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(city -> city.getUpdatedOn().orElse(city.getCreatedOn())))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<City> findTopNewest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(city -> city.getUpdatedOn().orElse(city.getCreatedOn()), Comparator.reverseOrder()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<City> findNextOldest(int pageSize, ScrollPosition afterCity) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(city -> city.getUpdatedOn().orElse(city.getCreatedOn())))
                .dropWhile(city -> city.getId() <= afterCity.elementId() || city.getUpdatedOn().orElse(city.getCreatedOn()).isBefore(afterCity.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<City> findNextNewest(int pageSize, ScrollPosition afterCity) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(city -> city.getUpdatedOn().orElse(city.getCreatedOn()), Comparator.reverseOrder()))
                .dropWhile(city -> city.getId() >= afterCity.elementId() || city.getUpdatedOn().orElse(city.getCreatedOn()).isAfter(afterCity.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public Optional<City> findById(int id) {
        return inMemoryDb.values()
                .stream()
                .filter(city -> city.getId().equals(id))
                .findAny();
    }

    @Override
    public void delete(City city) {
        inMemoryDb.remove(city.getId());
    }

    @Override
    public List<City> findAll() {
        return inMemoryDb.values().stream().toList();
    }

}
