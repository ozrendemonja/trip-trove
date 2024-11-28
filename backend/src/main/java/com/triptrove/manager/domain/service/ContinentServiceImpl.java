package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.repo.ContinentRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ContinentServiceImpl implements ContinentService {
    private final ContinentRepo continentRepo;

    @Override
    public String saveContinent(Continent continent) {
        continentRepo.save(continent);

        return continent.getName();
    }
}
