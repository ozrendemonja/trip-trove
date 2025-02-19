package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import com.triptrove.manager.domain.repo.AttractionRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class InMemoryAttractionRepository implements AttractionRepo {
    private final Map<Long, Attraction> inMemoryDb;
    private static long rowNumber = 1;

    @Override
    public Attraction save(Attraction attraction) {
        if (attraction.getId() == null) {
            attraction.setId(rowNumber++);
        }
        inMemoryDb.put(attraction.getId(), attraction);
        return attraction;
    }

    @Override
    public Optional<Attraction> findById(Long id) {
        return inMemoryDb.values()
                .stream()
                .filter(attraction -> attraction.getId().equals(id))
                .findAny();
    }

    @Override
    public Optional<Attraction> findByNameAndCityId(String name, Integer cityId) {
        return findByName(name).stream()
                .filter(attraction -> attraction.getCity().isPresent())
                .filter(attraction -> attraction.getCity().get().getId().equals(cityId))
                .findAny();
    }

    @Override
    public Optional<Attraction> findByNameAndRegionId(String name, Integer regionId) {
        return findByName(name).stream()
                .filter(attraction -> attraction.getRegion().getId().equals(regionId))
                .findAny();
    }

    @Override
    public Optional<Attraction> findByNameAndMainAttractionId(String name, Long mainAttractionId) {
        return findByName(name).stream()
                .filter(attraction -> attraction.getMain().isPresent())
                .filter(attraction -> attraction.getMain().get().getId().equals(mainAttractionId))
                .findAny();
    }

    @Override
    public List<Attraction> findTopOldest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(attraction -> attraction.getUpdatedOn().orElse(attraction.getCreatedOn())))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Attraction> findTopNewest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(attraction -> attraction.getUpdatedOn().orElse(attraction.getCreatedOn()), Comparator.reverseOrder()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Attraction> findNextOldest(int pageSize, ScrollPosition afterAttraction) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(attraction -> attraction.getUpdatedOn().orElse(attraction.getCreatedOn())))
                .dropWhile(attraction -> attraction.getId() <= afterAttraction.elementId() || attraction.getUpdatedOn().orElse(attraction.getCreatedOn()).isBefore(afterAttraction.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Attraction> findNextNewest(int pageSize, ScrollPosition afterAttraction) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(attraction -> attraction.getUpdatedOn().orElse(attraction.getCreatedOn()), Comparator.reverseOrder()))
                .dropWhile(attraction -> attraction.getId() >= afterAttraction.elementId() || attraction.getUpdatedOn().orElse(attraction.getCreatedOn()).isAfter(afterAttraction.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Attraction> findAll() {
        return inMemoryDb.values().stream().toList();
    }

    @Override
    public void delete(Attraction attraction) {
        inMemoryDb.remove(attraction.getId());
    }

    private List<Attraction> findByName(String name) {
        return inMemoryDb.values()
                .stream()
                .filter(attraction -> attraction.getName().equals(name))
                .toList();
    }

    @Override
    public List<Suggestion> search(String query, int limit) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(attraction -> attraction.getUpdatedOn().orElse(attraction.getCreatedOn()), Comparator.reverseOrder()))
                .filter(attraction -> attraction.getName().contains(query))
                .limit(limit)
                .map(attraction -> new Suggestion(attraction.getName(), attraction.getId().intValue()))
                .toList();
    }
}
