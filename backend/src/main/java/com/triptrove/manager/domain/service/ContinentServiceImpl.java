package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.SortDirection;
import com.triptrove.manager.domain.repo.ContinentRepo;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode;

@Service
@Slf4j
@AllArgsConstructor
public class ContinentServiceImpl implements ContinentService {
    private final ContinentRepo continentRepo;

    @Override
    public Continent saveContinent(Continent continent) {
        String name = continent.getName();
        log.atInfo().log("Processing save continent request for '{}'", name);
        if (continentRepo.findByName(name).isPresent()) {
            throw new BaseApiException("Continent already exists in the database", ErrorCode.DUPLICATE_NAME);
        }
        Continent result = continentRepo.save(continent);

        log.atInfo().log("Continent '{}' successfully saved", name);
        return result;
    }

    @Override
    public List<Continent> getAllContinents(SortDirection sortDirection) {
        log.atInfo().log("Getting a list of all continents ordered {}", sortDirection);
        if (sortDirection == SortDirection.ASCENDING) {
            return continentRepo.findAllOrderByUpdatedOnOrCreatedOnAsc();
        }
        return continentRepo.findAllOrderByUpdatedOnOrCreatedOnDesc();
    }

    @Override
    public void deleteContinent(Continent continent) {
        String name = continent.getName();
        log.atInfo().log("Deleting continent '{}'", name);
        if (continentRepo.hasContinentCountries(name)) {
            throw new BaseApiException("Continent has countries under", ErrorCode.HAS_CHILDREN);
        }
        int deletedElements = continentRepo.deleteByName(name);
        if (deletedElements == 0) {
            throw new BaseApiException("Continent not found", ErrorCode.OBJECT_NOT_FOUND);
        }
        log.atInfo().log("Continent '{}' is deleted", name);
    }

    @Override
    public Continent getContinent(Continent requestedContinent) {
        String name = requestedContinent.getName();
        log.atInfo().log("Getting a continent with name '{}'", name);
        var continent = continentRepo.findByName(name)
                .orElseThrow(() -> new BaseApiException("Continent '%s' does not exist in the database".formatted(name), ErrorCode.OBJECT_NOT_FOUND));
        log.atInfo().log("Got a continent with name '{}'", name);

        return continent;
    }

    @Override
    public void updateContinent(Continent oldContinent, Continent newContinent) {
        String oldName = oldContinent.getName();
        String newName = newContinent.getName();
        log.atInfo().log("Updating a continent with name '{}'", oldName);
        if (continentRepo.findByName(newName).isPresent()) {
            throw new BaseApiException("Continent already exists in the database", ErrorCode.DUPLICATE_NAME);
        }
        Continent continent = continentRepo.findByName(oldName)
                .orElseThrow(() -> new BaseApiException("Continent '%s' does not exist in the database".formatted(oldName), ErrorCode.OBJECT_NOT_FOUND));
        continent.setName(newName);
        continent.setUpdatedOn(LocalDateTime.now());
        continentRepo.save(continent);
        log.atInfo().log("Continent name updated to '{}'", newName);
    }
}
