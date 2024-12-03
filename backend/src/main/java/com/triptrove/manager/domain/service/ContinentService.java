package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;

import java.util.List;

public interface ContinentService {
    String saveContinent(Continent continent);
    List<Continent> getAllContinents();
    void deleteContinent(String name);
    Continent getContinent(String name);
}
