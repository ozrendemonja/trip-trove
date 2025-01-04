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

    void updateAttractionDestination(long id, boolean countrywide, Integer cityId, Integer regionId);

    void updateAttractionDetail(long id, String attractionName, Long mainAttractionId);

    void updateAttractionTraditional(long id, boolean isTraditional);

    void updateAttractionLocation(long id, String address, Double latitude, Double longitude);
}
