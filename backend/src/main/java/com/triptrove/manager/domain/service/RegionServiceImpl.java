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
        var country = countryRepo.findById(countryId).orElseThrow(() -> new BaseApiException("Country not found in database", ErrorCode.OBJECT_NOT_FOUND));
        if (regionRepo.findByNameAndCountryId(name, countryId).isPresent()) {
            throw new BaseApiException("Region '%s' in '%s' country already exists in the database.".formatted(name, country.getName()), ErrorCode.DUPLICATE_NAME);
        }
        var region = new Region();
        region.setName(name);
        region.setCountry(country);
        var result = regionRepo.save(region);
        log.atInfo().log("Region '{}' successfully saved", result.getName());

        return result;
    }

    @Override
    public List<Region> getRegions(SortDirection sortDirection) {
        log.atInfo().log("Getting the first page of regions, ordered in {} order", sortDirection);

        if (sortDirection == SortDirection.ASCENDING) {
            return regionRepo.findTopOldest(managerProperties.pageSize());
        }
        return regionRepo.findTopNewest(managerProperties.pageSize());
    }

    @Override
    public List<Region> getRegions(ScrollPosition afterRegion, SortDirection sortDirection) {
        log.atInfo().log("Getting a list of regions ordered in {} order, updated before {}", sortDirection, afterRegion.updatedOn());

        if (sortDirection == SortDirection.ASCENDING) {
            return regionRepo.findNextOldest(managerProperties.pageSize(), afterRegion);
        }
        return regionRepo.findNextNewest(managerProperties.pageSize(), afterRegion);
    }

    @Override
    public void deleteRegion(int id) {
        log.atInfo().log("Deleting region");
        regionRepo.findById(id).orElseThrow(() -> new BaseApiException("Region not found", ErrorCode.OBJECT_NOT_FOUND));
        regionRepo.deleteById(id);
        log.atInfo().log("Region deleted");
    }

    @Override
    public Region getRegion(int id) {
        log.atInfo().log("Getting region with id '{}'", id);
        return regionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Region not found in the database", ErrorCode.OBJECT_NOT_FOUND));
    }
}
