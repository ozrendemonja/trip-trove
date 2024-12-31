package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
@Log4j2
public class CityServiceImpl implements CityService {
    private final ManagerProperties managerProperties;
    private final CityRepo cityRepo;
    private final RegionRepo regionRepo;

    @Override
    public City saveCity(String name, int regionId) {
        log.atInfo().log("Processing save city request for city '{}'", name);
        var region = regionRepo.findById(regionId).orElseThrow(() -> new BaseApiException("Region not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        if (cityRepo.findByNameAndRegionId(name, regionId).isPresent()) {
            throw new BaseApiException("City '%s' in '%s' region already exists in the database.".formatted(name, region.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }

        var city = new City();
        city.setName(name);
        city.setRegion(region);
        var result = cityRepo.save(city);

        log.atInfo().log("City '{}' successfully saved", result.getName());
        return result;
    }

    @Override
    public List<City> getCities(SortDirection sortDirection) {
        log.atInfo().log("Getting the first page of cities, ordered in {} order", sortDirection);

        if (sortDirection == SortDirection.ASCENDING) {
            return cityRepo.findTopOldest(managerProperties.pageSize());
        }
        return cityRepo.findTopNewest(managerProperties.pageSize());
    }

    @Override
    public List<City> getCities(ScrollPosition afterCity, SortDirection sortDirection) {
        log.atInfo().log("Getting a list of cities ordered in {} order, updated before {}", sortDirection, afterCity.updatedOn());

        if (sortDirection == SortDirection.ASCENDING) {
            return cityRepo.findNextOldest(managerProperties.pageSize(), afterCity);
        }
        return cityRepo.findNextNewest(managerProperties.pageSize(), afterCity);
    }

    @Override
    public void deleteCity(int id) {
        log.atInfo().log("Deleting city");
        var city = cityRepo.findById(id).orElseThrow(() -> new BaseApiException("City not found", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        cityRepo.delete(city);
        log.atInfo().log("Region city");
    }

    @Override
    public City getCity(int id) {
        log.atInfo().log("Getting city with id '{}'", id);
        return cityRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("City not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

    @Override
    public void updateCityDetails(int id, String newCityName) {
        log.atInfo().log("Updating the city name to '{}'", newCityName);
        var city = cityRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("City not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        city.setName(newCityName);
        cityRepo.save(city);
        log.atInfo().log("City name has been updated to '{}'", newCityName);
    }

    @Override
    public void updateCityRegionDetails(int id, Integer regionId) {
        log.atInfo().log("Updating the city to belong to the different region");
        var city = cityRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("City not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        var newRegion = regionRepo.findById(regionId)
                .orElseThrow(() -> new BaseApiException("Region is not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        if (cityRepo.findByNameAndRegionId(city.getName(), regionId).isPresent()) {
            throw new BaseApiException("Cannot change the region to '%s' as it already exists in the database".formatted(newRegion.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }
        city.setRegion(newRegion);
        cityRepo.save(city);
        log.atInfo().log("Updated the city to belong to the '{}' region", newRegion.getName());
    }
}
