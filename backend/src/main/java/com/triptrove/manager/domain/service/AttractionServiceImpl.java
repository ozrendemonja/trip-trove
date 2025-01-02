package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Log4j2
public class AttractionServiceImpl implements AttractionService {
    private final CountryRepo countryRepo;
    private final RegionRepo regionRepo;
    private final CityRepo cityRepo;
    private final AttractionRepo attractionRepo;

    @Override
    public Attraction saveAttraction(Integer countryId, Integer regionId, Integer cityId, Long mainAttractionId, Attraction attraction) {
        log.atInfo().log("Processing save attraction request for attraction '{}'", attraction.getName());

        var country = countryRepo.findById(countryId).orElseThrow();
        var region = regionRepo.findById(regionId).orElseThrow();
        City city = null;
        if (cityId != null) {
            city = cityRepo.findById(cityId).orElseThrow();
        }
        Attraction mainAttraction = null;
        if (mainAttractionId != null) {
            mainAttraction = attractionRepo.findById(mainAttractionId).orElseThrow();
        }

        attraction.setCountry(country);
        attraction.setRegion(region);
        attraction.setCity(city);
        attraction.setMain(mainAttraction);

        var result = attractionRepo.save(attraction);
        log.atInfo().log("Attraction '{}' successfully saved", result.getName());

        return result;
    }
}
