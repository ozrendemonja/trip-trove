package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Continent;

import java.util.List;

public interface ContinentRepo {
    Continent save(Continent continent);
    List<Continent> findAll();
    void deleteById(String name);
}
