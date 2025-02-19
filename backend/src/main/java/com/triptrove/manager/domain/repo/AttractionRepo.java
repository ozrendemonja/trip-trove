package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;

import java.util.List;
import java.util.Optional;

public interface AttractionRepo {
    Attraction save(Attraction attraction);

    Optional<Attraction> findById(Long id);

    Optional<Attraction> findByNameAndCityId(String name, Integer cityId);

    Optional<Attraction> findByNameAndRegionId(String name, Integer regionId);

    Optional<Attraction> findByNameAndMainAttractionId(String name, Long mainAttractionId);

    List<Attraction> findTopOldest(int pageSize);

    List<Attraction> findTopNewest(int pageSize);

    List<Attraction> findNextOldest(int pageSize, ScrollPosition afterAttraction);

    List<Attraction> findNextNewest(int pageSize, ScrollPosition afterAttraction);

    List<Attraction> findAll();

    void delete(Attraction attraction);

    List<Suggestion> search(String query, int limit);
}
