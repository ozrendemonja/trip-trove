package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Attraction;

public interface AttractionService {
    Attraction saveAttraction(Integer countryId, Integer regionId, Integer cityId, Long mainAttractionId, Attraction attraction);
}
