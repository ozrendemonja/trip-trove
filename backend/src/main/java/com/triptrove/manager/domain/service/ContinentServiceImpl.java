package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.repo.ContinentRepo;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@AllArgsConstructor
public class ContinentServiceImpl implements ContinentService {
    private final ContinentRepo continentRepo;

    @Override
    public String saveContinent(Continent continent) {
        log.atInfo().log("Processing save continent request for '{}'", continent.getName());
        continentRepo.save(continent);

        log.atInfo().log("Continent '{}' successfully saved", continent.getName());
        return continent.getName();
    }

    @Override
    public List<Continent> getAllContinents() {
        log.atInfo().log("Getting a list of all continents");
        return continentRepo.findAll();
    }

    @Override
    public void deleteContinent(String name) {
        log.atInfo().log("Deleting continent {}", name);
        continentRepo.deleteById(name);
    }

    @Override
    public Continent getContinent(String name) {
        log.atInfo().log("Getting a continent with name {}", name);
        var continent = continentRepo.findByName(name);
        log.atInfo().log("Got a continent with name {}", name);

        return continent;
    }
}
