package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Continent;

import java.util.List;
import java.util.Optional;

public interface ContinentRepo {
    Continent save(Continent continent);

    List<Continent> findAll();

    List<Continent> findAllOrderByUpdatedOnOrCreatedOnAsc();

    List<Continent> findAllOrderByUpdatedOnOrCreatedOnDesc();

    void deleteByName(String name);

    Optional<Continent> findByName(String name);
}
