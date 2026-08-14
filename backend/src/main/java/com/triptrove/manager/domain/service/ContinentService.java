package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.ContinentName;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface ContinentService {
    ContinentName saveContinent(ContinentName continentName);
    List<Continent> getAllContinents(SortDirection sortDirection);
    void deleteContinent(ContinentName continentName);
    Continent getContinent(ContinentName continentName);
    void updateContinent(ContinentName oldName, ContinentName newName);
}
