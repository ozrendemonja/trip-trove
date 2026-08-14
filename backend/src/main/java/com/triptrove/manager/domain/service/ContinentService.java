package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface ContinentService {
    Continent saveContinent(Continent continent);
    List<Continent> getAllContinents(SortDirection sortDirection);
    void deleteContinent(Continent continent);
    Continent getContinent(Continent continent);
    void updateContinent(Continent oldContinent, Continent newContinent);
}
