package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Country;

import java.util.List;
import java.util.Optional;

public interface CountryRepo {
    Country save(Country country);

    List<Country> findAll();

    Optional<Country> findByName(String name);
}
