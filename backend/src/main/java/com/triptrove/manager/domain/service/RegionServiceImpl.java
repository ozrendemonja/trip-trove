package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;
import com.triptrove.manager.domain.repo.CountryRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode;

@Service
@Log4j2
@AllArgsConstructor
public class RegionServiceImpl implements RegionService {
    private final ManagerProperties managerProperties;
    private final RegionRepo regionRepo;
    private final CountryRepo countryRepo;

    @Override
    public Region saveRegion(String name, int countryId) {
        log.atInfo().log("Processing save region request for region '{}'", name);
        var country = countryRepo.findById(countryId).orElseThrow(() -> new BaseApiException("Country not found", ErrorCode.RESOURCE_NOT_FOUND, countryId));
        if (regionRepo.isNameAlreadyUsedInCountry(name, countryId)) {
            throw new BaseApiException("Region name already exists in country", ErrorCode.NAME_ALREADY_EXISTS, name, country.getName());
        }
        var region = new Region();
        region.setName(name);
        region.setCountry(country);
        var result = regionRepo.save(region);
        log.atInfo().log("Region '{}' successfully saved", result.getName());

        return result;
    }

    @Override
    public List<Region> getRegions(ScrollPosition afterRegion, SortDirection sortDirection) {
        if (sortDirection == SortDirection.ASCENDING) {
            return getRegionsAfter(afterRegion);
        }
        return getRegionsBefore(afterRegion);
    }

    private List<Region> getRegionsAfter(ScrollPosition region) {
        if (region == null) {
            log.atInfo().log("Getting a list of first {} oldest regions", managerProperties.pageSize());
            List<Region> result = regionRepo.findAllOrderByOldest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} regions", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of oldest regions, updated after {}", region.updatedOn());
        List<Region> result = regionRepo.findOldestAfter(region, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} regions", result.size());
        return result;
    }

    private List<Region> getRegionsBefore(ScrollPosition region) {
        if (region == null) {
            log.atInfo().log("Getting a list of first {} newest regions", managerProperties.pageSize());
            List<Region> result = regionRepo.findAllOrderByNewest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} regions", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of newest regions, updated before {}", region.updatedOn());
        List<Region> result = regionRepo.findNewestBefore(region, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} regions", result.size());
        return result;
    }

    @Override
    public void deleteRegion(int id) {
        log.atInfo().log("Deleting region");
        if (regionRepo.hasCitiesUnder(id) || regionRepo.hasAttractionsUnder(id)) {
            throw new BaseApiException("Region still contains cities or attractions", ErrorCode.RESOURCE_HAS_DEPENDENCIES, id);
        }

        var region = regionRepo.findById(id).orElseThrow(() -> new BaseApiException("Region not found", ErrorCode.RESOURCE_NOT_FOUND, id));
        regionRepo.delete(region);
        log.atInfo().log("Region deleted");
    }

    @Override
    public Region getRegion(int id) {
        log.atInfo().log("Getting region with id '{}'", id);
        return regionRepo.findById(id).orElseThrow(() -> new BaseApiException("Region not found", ErrorCode.RESOURCE_NOT_FOUND, id));
    }

    @Override
    public void updateRegionDetails(int id, String newName) {
        log.atInfo().log("Updating the region name to '{}'", newName);
        var region = regionRepo.findById(id).orElseThrow(() -> new BaseApiException("Region not found", ErrorCode.RESOURCE_NOT_FOUND, id));
        if (regionRepo.isNameAlreadyUsedInCountry(newName, region.getCountry().getId())) {
            throw new BaseApiException("Region name already exists in country", ErrorCode.NAME_ALREADY_EXISTS, newName, region.getCountry().getName());
        }
        region.setName(newName);
        regionRepo.save(region);
        log.atInfo().log("Region name has been updated to '{}'", newName);
    }

    @Override
    public void updateRegionCountryDetails(int id, int countryId) {
        log.atInfo().log("Updating the region to belong to the different country");
        var region = regionRepo.findById(id).orElseThrow(() -> new BaseApiException("Region not found", ErrorCode.RESOURCE_NOT_FOUND, id));
        var newCountry = countryRepo.findById(countryId).orElseThrow(() -> new BaseApiException("Country not found", ErrorCode.RESOURCE_NOT_FOUND, countryId));
        if (regionRepo.isNameAlreadyUsedInCountry(region, countryId)) {
            throw new BaseApiException("Region name already exists in country", ErrorCode.NAME_ALREADY_EXISTS, region.getName(), newCountry.getName());
        }
        region.setCountry(newCountry);
        regionRepo.save(region);
        log.atInfo().log("Updated the region to belong to the '{}' country", newCountry.getName());
    }
}
