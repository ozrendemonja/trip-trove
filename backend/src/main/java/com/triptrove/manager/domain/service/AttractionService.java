package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface AttractionService {
    Attraction saveAttraction(Integer regionId, Integer cityId, Long mainAttractionId, Attraction attraction);

    List<Attraction> getAttractions(SortDirection sortDirection);

    List<Attraction> getAttractions(ScrollPosition afterAttraction, SortDirection sortDirection);

    void deleteAttraction(Long id);

    Attraction getAttraction(Long id);
}
