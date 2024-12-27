package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.CountryScrollPosition;
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
    public List<Country> findByName(String name) {
        return inMemoryDb.values()
                .stream()
                .filter(country -> country.getName().equals(name))
                .toList();
    }


    @Override
    public List<Country> findTopNewest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn()), Comparator.reverseOrder()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Country> findTopOldest(int pageSize) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn())))
                .limit(pageSize)
                .toList();
    }

    @Override
    public Optional<Country> findByNameAndContinentName(String countryName, String continentName) {
        return findByName(countryName).stream()
                .filter(country -> country.getContinent().getName().equals(continentName))
                .findAny();
    }

    @Override
    public void deleteById(Integer id) {
        inMemoryDb.remove(id);
    }

    @Override
    public Optional<Country> findById(Integer id) {
        return inMemoryDb.values()
                .stream()
                .filter(country -> country.getId().equals(id))
                .findAny();
    }

    @Override
    public List<String> search(String query) {
        return inMemoryDb.values()
                .stream()
                .map(Country::getName)
                .filter(name -> name.contains(query))
                .toList();
    }

    @Override
    public List<Country> findNextOldest(int pageSize, CountryScrollPosition afterCountry) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn())))
                .dropWhile(country -> country.getId() <= afterCountry.countryId() || country.getUpdatedOn().orElse(country.getCreatedOn()).isBefore(afterCountry.updatedOn()))
                .limit(pageSize)
                .toList();
    }

    @Override
    public List<Country> findNextNewest(int pageSize, CountryScrollPosition afterCountry) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(country -> country.getUpdatedOn().orElse(country.getCreatedOn()), Comparator.reverseOrder()))
                .dropWhile(country -> country.getId() >= afterCountry.countryId() || country.getUpdatedOn().orElse(country.getCreatedOn()).isAfter(afterCountry.updatedOn()))
                .limit(pageSize)
                .toList();
    }
}
