package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.repo.AttractionRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class InMemoryAttractionRepository implements AttractionRepo {
    private final Map<Long, Attraction> inMemoryDb;
    private static long rowNumber = 0;

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
}
