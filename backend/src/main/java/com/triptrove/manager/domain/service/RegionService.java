package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.RegionSummary;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface RegionService {
    Region saveRegion(String name, int countryId);

    List<RegionSummary> getRegions(ScrollPosition afterRegion, SortDirection sortDirection);

    void deleteRegion(int id);

    RegionSummary getRegion(int id);

    void updateRegionDetails(int id, String newName);

    void updateRegionCountryDetails(int id, int countryId);
}
