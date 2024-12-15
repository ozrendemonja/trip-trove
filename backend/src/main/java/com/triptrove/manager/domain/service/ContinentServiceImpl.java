package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.DuplicateNameException;
import com.triptrove.manager.domain.model.ObjectNotFoundException;
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
        if (continentRepo.findByName(continent.getName()).isPresent()) {
            log.atInfo().log("Continent already exists in the database");
            throw new DuplicateNameException();
        }
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
        log.atInfo().log("Deleting continent '{}'", name);
        continentRepo.deleteByName(name);
    }

    @Override
    public Continent getContinent(String name) {
        log.atInfo().log("Getting a continent with name '{}'", name);
        var continent = continentRepo.findByName(name)
                .orElseThrow(ObjectNotFoundException::new);
        log.atInfo().log("Got a continent with name '{}'", name);

        return continent;
    }

    @Override
    public void updateContinent(String oldName, String newName) {
        log.atInfo().log("Updating a continent with name '{}'", oldName);
        Continent continent = continentRepo.findByName(oldName).orElseThrow(ObjectNotFoundException::new);
        continent.setName(newName);
        continentRepo.save(continent);
        log.atInfo().log("Continent name updated to '{}'", newName);
    }
}
