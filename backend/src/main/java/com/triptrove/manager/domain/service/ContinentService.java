package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.SortDirection;

import java.util.List;

public interface ContinentService {
    String saveContinent(Continent continent);
    List<Continent> getAllContinents(SortDirection sortDirection);
    void deleteContinent(String name);
    Continent getContinent(String name);
    void updateContinent(String oldName, String newName);
}
