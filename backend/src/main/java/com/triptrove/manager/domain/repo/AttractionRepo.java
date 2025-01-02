package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Attraction;

import java.util.Optional;

public interface AttractionRepo {
    Attraction save(Attraction attraction);

    Optional<Attraction> findById(Long id);
}
