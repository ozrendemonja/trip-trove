package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Region;

public interface RegionService {
    Region saveRegion(String name, int countryId);
}
