package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
@Log4j2
public class AttractionServiceImpl implements AttractionService {
    private final ManagerProperties managerProperties;
    private final RegionRepo regionRepo;
    private final CityRepo cityRepo;
    private final AttractionRepo attractionRepo;

    @Override
    public Attraction saveAttraction(Integer regionId, Integer cityId, Long mainAttractionId, Attraction attraction) {
        log.atInfo().log("Processing save attraction request for attraction '{}'", attraction.getName());

        if (cityId != null) {
            log.atInfo().log("Adding attraction under city");
            var city = cityRepo.findById(cityId).orElseThrow(() -> new BaseApiException("City not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            if (attractionRepo.findByNameAndCityId(attraction.getName(), cityId).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' city already exists in the database.".formatted(attraction.getName(), city.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            if (attractionRepo.findByNameAndRegionId(attraction.getName(), city.getRegion().getId()).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' region already exists in the database.".formatted(attraction.getName(), city.getRegion().getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            attraction.setCity(city);
        } else {
            log.atInfo().log("Adding attraction under region");
            var region = regionRepo.findById(regionId).orElseThrow(() -> new BaseApiException("Region not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            if (attractionRepo.findByNameAndRegionId(attraction.getName(), regionId).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' region already exists in the database.".formatted(attraction.getName(), region.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            attraction.setRegion(region);
        }

        if (mainAttractionId != null) {
            var mainAttraction = attractionRepo.findById(mainAttractionId).orElseThrow(() -> new BaseApiException("Main attraction not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            if (attractionRepo.findByNameAndMainAttractionId(attraction.getName(), mainAttractionId).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' main attraction already exists in the database.".formatted(attraction.getName(), mainAttraction.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            attraction.setMain(mainAttraction);
        }

        var result = attractionRepo.save(attraction);
        log.atInfo().log("Attraction '{}' successfully saved", result.getName());
        return result;
    }

    @Override
    public List<Attraction> getAttractions(SortDirection sortDirection) {
        log.atInfo().log("Getting the first page of attractions, ordered in {} order", sortDirection);

        if (sortDirection == SortDirection.ASCENDING) {
            return attractionRepo.findTopOldest(managerProperties.pageSize());
        }
        return attractionRepo.findTopNewest(managerProperties.pageSize());
    }

    @Override
    public List<Attraction> getAttractions(ScrollPosition afterAttraction, SortDirection sortDirection) {
        log.atInfo().log("Getting a list of attractions ordered in {} order, updated before {}", sortDirection, afterAttraction.updatedOn());

        if (sortDirection == SortDirection.ASCENDING) {
            return attractionRepo.findNextOldest(managerProperties.pageSize(), afterAttraction);
        }
        return attractionRepo.findNextNewest(managerProperties.pageSize(), afterAttraction);
    }

    @Override
    public void deleteAttraction(Long id) {
        log.atInfo().log("Deleting attraction");
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attractionRepo.delete(attraction);
        log.atInfo().log("Attraction deleted");
    }

    @Override
    public Attraction getAttraction(Long id) {
        log.atInfo().log("Getting attraction with id '{}'", id);
        return attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

    @Override
    public void updateAttractionDestination(long id, boolean countrywide, Integer cityId, Integer regionId) {
        log.atInfo().log("Updating the attraction destination");
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));

        attraction.setCountrywide(countrywide);
        if (cityId != null) {
            log.atInfo().log("Adding attraction to the city");
            var city = cityRepo.findById(cityId).orElseThrow(() -> new BaseApiException("City not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            if (attractionRepo.findByNameAndCityId(attraction.getName(), cityId).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' city already exists in the database.".formatted(attraction.getName(), city.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            if (attractionRepo.findByNameAndRegionId(attraction.getName(), city.getRegion().getId()).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' region already exists in the database.".formatted(attraction.getName(), city.getRegion().getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            attraction.setCity(city);
        } else {
            log.atInfo().log("Adding attraction to the region");
            var region = regionRepo.findById(regionId).orElseThrow(() -> new BaseApiException("Region not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            if (attractionRepo.findByNameAndRegionId(attraction.getName(), regionId).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' region already exists in the database.".formatted(attraction.getName(), region.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
            attraction.setRegion(region);
        }

        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionDetail(long id, String newAttractionName, Long mainAttractionId) {
        log.atInfo().log("Updating the attraction detail adding name {}", newAttractionName);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));

        if (attraction.getCity().isPresent()) {
            if (attractionRepo.findByNameAndCityId(attraction.getName(), attraction.getCity().get().getId()).isPresent()) {
                throw new BaseApiException("Attraction '%s' in '%s' city already exists in the database.".formatted(attraction.getName(), attraction.getCity().get().getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }
        }
        if (attractionRepo.findByNameAndRegionId(newAttractionName, attraction.getRegion().getId()).isPresent()) {
            throw new BaseApiException("Attraction '%s' in '%s' region already exists in the database.".formatted(attraction.getName(), attraction.getRegion().getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }

        attraction.setName(newAttractionName);
        Attraction mainAttraction = null;
        if (mainAttractionId != null) {
            mainAttraction = attractionRepo.findById(mainAttractionId)
                    .orElseThrow(() -> new BaseApiException("Main attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        }
        attraction.setMain(mainAttraction);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionTraditional(long id, boolean isTraditional) {
        log.atInfo().log("Updating the attraction detail setting  isTraditional to {}", isTraditional);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setTraditional(isTraditional);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionLocation(long id, String address, Double latitude, Double longitude) {

    }
}
