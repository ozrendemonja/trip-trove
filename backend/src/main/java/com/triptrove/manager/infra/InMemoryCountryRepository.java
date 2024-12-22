package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.repo.CountryRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class InMemoryCountryRepository implements CountryRepo {
    private final Map<Integer, Country> inMemoryDb;
    private static int rowNumber = 0;

    @Override
    public Country save(Country country) {
        if (country.getId() == null) {
            country.setId(rowNumber);
            inMemoryDb.put(rowNumber++, country);
        }
        return inMemoryDb.put(country.getId(), country);
    }

    @Override
    public List<Country> findAll() {
        return inMemoryDb.values().stream().toList();
    }

    @Override
    public Optional<Country> findByName(String name) {
        return inMemoryDb.values()
                .stream()
                .filter(country -> country.getName().equals(name))
                .findAny();
    }

    @Override
    public List<Country> findAllOrderByUpdatedOnOrCreatedOnAsc() {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn())))
                .toList();
    }

    @Override
    public List<Country> findAllOrderByUpdatedOnOrCreatedOnDesc() {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn()), Comparator.reverseOrder()))
                .toList();
    }
}
