package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
        assignAttractionTo(attraction, regionId, cityId);
        addAttractionUnder(attraction, mainAttractionId);

        var result = attractionRepo.save(attraction);
        log.atInfo().log("Attraction '{}' successfully saved", result.getName());
        return result;
    }

    private void addAttractionUnder(Attraction attraction, Long mainAttractionId) {
        if (mainAttractionId == null) {
            attraction.setMain(null);
            return;
        }

        if (attractionRepo.existsByNameAndMainId(attraction.getName(), mainAttractionId)) {
            throw new BaseApiException("Attraction '%s' already exists under given main attraction.".formatted(attraction.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }

        var mainAttraction = attractionRepo.findById(mainAttractionId).orElseThrow(() -> new BaseApiException("Main attraction not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        if (!attraction.isUnderContinent(mainAttraction.getCountry().getContinent())) {
            throw new BaseApiException("Attraction '%s' is in different continent then '%s' main attraction.".formatted(attraction.getName(), mainAttraction.getName()), BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
        attraction.setMain(mainAttraction);
    }

    private void assignAttractionTo(Attraction attraction, Integer regionId, Integer cityId) {
        if (cityId != null) {
            if (attractionRepo.existsByNameAndCityId(attraction.getName(), cityId)) {
                throw new BaseApiException("Attraction '%s' already exists under given city.".formatted(attraction.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }

            log.atInfo().log("Adding attraction under city");
            var city = cityRepo.findById(cityId).orElseThrow(() -> new BaseApiException("City not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            attraction.underCity(city);
        } else {
            if (attractionRepo.existsByNameAndRegionId(attraction.getName(), regionId)) {
                throw new BaseApiException("Attraction '%s' already exists under given region.".formatted(attraction.getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
            }

            log.atInfo().log("Adding attraction under region");
            var region = regionRepo.findById(regionId).orElseThrow(() -> new BaseApiException("Region not found in database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
            attraction.underRegion(region);
        }
    }

    @Override
    public List<Attraction> getAttractions(ScrollPosition afterAttraction, SortDirection sortDirection) {
        if (sortDirection == SortDirection.ASCENDING) {
            return getAttractionsAfter(afterAttraction);
        }
        return getAttractionsBefore(afterAttraction);
    }

    private List<Attraction> getAttractionsAfter(ScrollPosition attraction) {
        if (attraction == null) {
            log.atInfo().log("Getting a list of first {} oldest attractions", managerProperties.pageSize());
            List<Attraction> result = attractionRepo.findAllOrderByOldest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} attractions", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of oldest attractions, updated after {}", attraction.updatedOn());
        List<Attraction> result = attractionRepo.findOldestAfter(attraction, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} attractions", result.size());
        return result;
    }

    private List<Attraction> getAttractionsBefore(ScrollPosition attraction) {
        if (attraction == null) {
            log.atInfo().log("Getting a list of first {} newest attractions", managerProperties.pageSize());
            List<Attraction> result = attractionRepo.findAllOrderByNewest(Limit.of(managerProperties.pageSize()));
            log.atInfo().log("Found {} attractions", result.size());
            return result;
        }
        log.atInfo().log("Getting a list of newest attractions, updated before {}", attraction.updatedOn());
        List<Attraction> result = attractionRepo.findNewestBefore(attraction, Limit.of(managerProperties.pageSize()));
        log.atInfo().log("Found {} attractions", result.size());
        return result;
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

        assignAttractionTo(attraction, regionId, cityId);
        attraction.setCountrywide(countrywide);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionDetail(long id, String newAttractionName, Long mainAttractionId) {
        log.atInfo().log("Updating the attraction detail adding name {}", newAttractionName);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));

        if (attraction.getCity().isPresent() && attractionRepo.existsByNameAndCityId(newAttractionName, attraction.getCity().get().getId())) {
            throw new BaseApiException("Attraction '%s' in '%s' city already exists in the database.".formatted(attraction.getName(), attraction.getCity().get().getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }
        if (attractionRepo.existsByNameAndRegionId(newAttractionName, attraction.getRegion().getId())) {
            throw new BaseApiException("Attraction '%s' in '%s' region already exists in the database.".formatted(attraction.getName(), attraction.getRegion().getName()), BaseApiException.ErrorCode.DUPLICATE_NAME);
        }
        attraction.setName(newAttractionName);
        addAttractionUnder(attraction, mainAttractionId);

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
    public void updateAttractionLocation(long id, String newAddress, Double latitude, Double longitude) {
        log.atInfo().log("Updating the attraction location to '{}' address and lat '{}', long '{}'", newAddress, latitude, longitude);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        Location location = null;
        if (latitude != null && longitude != null) {
            location = new Location(latitude, longitude);
        }
        attraction.setAddress(new Address(newAddress, location));
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionCategory(long id, AttractionCategory attractionCategory) {
        log.atInfo().log("Updating the attraction category to '{}'", attractionCategory);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setCategory(attractionCategory);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionType(long id, AttractionType attractionType) {
        log.atInfo().log("Updating the attraction type to '{}'", attractionType);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setType(attractionType);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionVisit(long id, Boolean mustVisit) {
        log.atInfo().log("Updating the attraction must visit to '{}'", mustVisit);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setMustVisit(mustVisit);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionTip(long id, String tip) {
        log.atInfo().log("Updating the attraction tip");
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setTip(tip);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionVisitPeriod(long id, VisitPeriod visitPeriod) {
        log.atInfo().log("Updating the attraction visit period to {}", visitPeriod);
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setOptimalVisitPeriod(visitPeriod);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionInformationProvider(long id, String infoFrom, LocalDate infoRecorded) {
        log.atInfo().log("Updating the attraction information provider");
        var attraction = attractionRepo.findById(id)
                .orElseThrow(() -> new BaseApiException("Attraction not found in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
        attraction.setInformationProvider(new InformationProvider(infoFrom, infoRecorded));
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

}