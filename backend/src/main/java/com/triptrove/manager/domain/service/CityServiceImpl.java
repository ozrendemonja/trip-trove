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
import org.springframework.data.domain.Limit;
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
        var region = regionRepo.findById(regionId).orElseThrow(() -> new BaseApiException("City not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        if (cityRepo.existsByNameAndRegionId(name, regionId)) {
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
    public List<City> getCities(ScrollPosition afterCity, SortDirection sortDirection) {
        if (sortDirection == SortDirection.ASCENDING) {
            return getCityAfter(afterCity);
        }
        return getCityBefore(afterCity);
    }

    private List<City> getCityAfter(ScrollPosition city) {
        if (city == null) {
            log.atInfo().log("Getting a list of first {} oldest cities", managerProperties.pageSize());
            List<City> result = cityRepo.findAllOrderByOldest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} cities", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of oldest cities, updated after {}", city.updatedOn());
        List<City> result = cityRepo.findOldestAfter(city, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} cities", result.size());
        return result;
    }

    private List<City> getCityBefore(ScrollPosition city) {
        if (city == null) {
            log.atInfo().log("Getting a list of first {} newest cities", managerProperties.pageSize());
            List<City> result = cityRepo.findAllOrderByNewest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} cities", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of newest cities, updated before {}", city.updatedOn());
        List<City> result = cityRepo.findNewestBefore(city, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} cities", result.size());
        return result;
    }

    @Override
    public void deleteCity(int id) {
        log.atInfo().log("Deleting city");
        if (cityRepo.hasAttractionsUnder(id)) {
            throw new BaseApiException("City has attractions under", BaseApiException.ErrorCode.HAS_CHILDREN);
        }

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
        if (cityRepo.existsByNameAndRegionId(newCityName, city.getRegion().getId())) {
            throw new BaseApiException("Cannot change the city to '%s' as it already exists in the database".formatted(city.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }
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
        if (cityRepo.existsByNameAndRegionId(city.getName(), regionId)) {
            throw new BaseApiException("Cannot change the region to '%s' as it already exists in the database".formatted(newRegion.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }
        city.setRegion(newRegion);
        cityRepo.save(city);
        log.atInfo().log("Updated the city to belong to the '{}' region", newRegion.getName());
    }
}
