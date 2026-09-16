package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.InformationProviderRepo;
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
    private final InformationProviderRepo informationProviderRepo;

    @Override
    public Attraction saveAttraction(Integer regionId, Integer cityId, Long mainAttractionId, String infoFrom, Attraction attraction) {
        log.atInfo().log("Processing save attraction request for attraction '{}'", attraction.getName());
        var destination = resolveDestination(attraction.getName(), attraction.getId(), regionId, cityId);
        var mainAttraction = resolveMainAttraction(attraction.getName(), attraction.getId(), destination.continent(), mainAttractionId);
        var informationProvider = findOrCreateInformationProvider(infoFrom);

        destination.assignTo(attraction);
        attraction.setMain(mainAttraction);
        attraction.setInformationProvider(informationProvider);

        var result = attractionRepo.save(attraction);
        log.atInfo().log("Attraction '{}' successfully saved", result.getName());
        return result;
    }

    private InformationProvider findOrCreateInformationProvider(String sourceName) {
        return informationProviderRepo.findBySourceName(sourceName).orElseGet(() -> informationProviderRepo.save(new InformationProvider(sourceName)));
    }

    private void deleteInformationProviderIfOrphan(InformationProvider informationProvider) {
        if (informationProvider == null || informationProvider.getId() == null) {
            return;
        }
        if (!informationProviderRepo.isReferencedByAnyAttraction(informationProvider.getId())) {
            log.atInfo().log("Deleting orphan information provider '{}'", informationProvider.getSourceName());
            informationProviderRepo.delete(informationProvider);
        }
    }

    private Attraction resolveMainAttraction(String attractionName, Long attractionId, Continent attractionContinent, Long mainAttractionId) {
        if (mainAttractionId == null) {
            return null;
        }

        if (attractionRepo.isNameAlreadyUsedUnderMain(attractionName, mainAttractionId, attractionId)) {
            throw new BaseApiException("Attraction name already exists under main attraction", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, attractionName, mainAttractionId);
        }

        var mainAttraction = attractionRepo.findById(mainAttractionId).orElseThrow(() -> new BaseApiException("Main attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, mainAttractionId));
        if (!attractionContinent.getId().equals(mainAttraction.getCountry().getContinent().getId())) {
            throw new BaseApiException(BaseApiException.ErrorCode.ATTRACTION_OUTSIDE_MAIN_ATTRACTION_CONTINENT, attractionName, mainAttraction.getName());
        }
        return mainAttraction;
    }

    private AttractionDestination resolveDestination(String attractionName, Long attractionId, Integer regionId, Integer cityId) {
        if (cityId != null) {
            if (attractionRepo.isNameAlreadyUsedInCity(attractionName, cityId, attractionId)) {
                throw new BaseApiException("Attraction name already exists in city", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, attractionName, cityId);
            }

            var city = cityRepo.findById(cityId).orElseThrow(() -> new BaseApiException("City not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, cityId));
            return new AttractionDestination(city, city.getRegion());
        }

        if (attractionRepo.isNameAlreadyUsedInRegion(attractionName, regionId, attractionId)) {
            throw new BaseApiException("Attraction name already exists in region", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, attractionName, regionId);
        }
        var region = regionRepo.findById(regionId).orElseThrow(() -> new BaseApiException("Region not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, regionId));
        return new AttractionDestination(null, region);
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
        if (attractionRepo.isMainAttraction(id)) {
            throw new BaseApiException("Attraction still has sub-attractions", BaseApiException.ErrorCode.RESOURCE_HAS_DEPENDENCIES, id);
        }

        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        var previousProvider = attraction.getInformationProvider();
        attractionRepo.delete(attraction);
        attractionRepo.flush();
        deleteInformationProviderIfOrphan(previousProvider);
        log.atInfo().log("Attraction deleted");
    }

    @Override
    public Attraction getAttraction(Long id) {
        log.atInfo().log("Getting attraction with id '{}'", id);
        return attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
    }

    @Override
    public void updateAttractionDestination(long id, boolean countrywide, Integer cityId, Integer regionId) {
        log.atInfo().log("Updating the attraction destination");
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));

        var destination = resolveDestination(attraction.getName(), attraction.getId(), regionId, cityId);
        destination.assignTo(attraction);
        attraction.setCountrywide(countrywide);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionDetail(long id, String newAttractionName, Long mainAttractionId) {
        log.atInfo().log("Updating the attraction detail adding name {}", newAttractionName);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));

        if (attraction.getCity().isPresent() && attractionRepo.isNameAlreadyUsedInCity(newAttractionName, attraction.getCity().get().getId(), attraction.getId())) {
            throw new BaseApiException("Attraction name already exists in city", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, newAttractionName, attraction.getCity().get().getId());
        }
        if (attractionRepo.isNameAlreadyUsedInRegion(newAttractionName, attraction.getRegion().getId(), attraction.getId())) {
            throw new BaseApiException("Attraction name already exists in region", BaseApiException.ErrorCode.NAME_ALREADY_EXISTS, newAttractionName, attraction.getRegion().getId());
        }
        var mainAttraction = resolveMainAttraction(newAttractionName, attraction.getId(), attraction.getCountry().getContinent(), mainAttractionId);

        attraction.setName(newAttractionName);
        attraction.setMain(mainAttraction);

        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionTraditional(long id, boolean isTraditional) {
        log.atInfo().log("Updating the attraction detail setting  isTraditional to {}", isTraditional);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        attraction.setTraditional(isTraditional);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionLocation(long id, String newAddress, Double latitude, Double longitude) {
        log.atInfo().log("Updating the attraction location to '{}' address and lat '{}', long '{}'", newAddress, latitude, longitude);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
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
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        attraction.setCategory(attractionCategory);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionType(long id, AttractionType attractionType) {
        log.atInfo().log("Updating the attraction type to '{}'", attractionType);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        attraction.setType(attractionType);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionVisit(long id, Boolean mustVisit) {
        log.atInfo().log("Updating the attraction must visit to '{}'", mustVisit);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        attraction.setMustVisit(mustVisit);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionPermanentlyClosed(long id, boolean isPermanentlyClosed) {
        log.atInfo().log("Updating attraction permanently closed status to '{}'", isPermanentlyClosed);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));

        if (isPermanentlyClosed) {
            attraction.markPermanentlyClosed();
        } else {
            attraction.reopen();
        }

        attractionRepo.save(attraction);
        log.atInfo().log("Attraction permanently closed status has been updated");
    }

    @Override
    public void updateAttractionTip(long id, String tip) {
        log.atInfo().log("Updating the attraction tip");
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        attraction.setTip(tip);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionVisitPeriod(long id, VisitPeriod visitPeriod) {
        log.atInfo().log("Updating the attraction visit period to {}", visitPeriod);
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        attraction.setOptimalVisitPeriod(visitPeriod);
        attractionRepo.save(attraction);
        log.atInfo().log("Attraction has been updated");
    }

    @Override
    public void updateAttractionInformationProvider(long id, String infoFrom, LocalDate infoRecorded) {
        log.atInfo().log("Updating the attraction information provider");
        var attraction = attractionRepo.findById(id).orElseThrow(() -> new BaseApiException("Attraction not found", BaseApiException.ErrorCode.RESOURCE_NOT_FOUND, id));
        var previousProvider = attraction.getInformationProvider();
        attraction.setInformationProvider(findOrCreateInformationProvider(infoFrom));
        attraction.setRecorded(infoRecorded);
        attractionRepo.save(attraction);
        attractionRepo.flush();
        if (!previousProvider.getId().equals(attraction.getInformationProvider().getId())) {
            deleteInformationProviderIfOrphan(previousProvider);
        }
        log.atInfo().log("Attraction has been updated");
    }

    private record AttractionDestination(City city, Region region) {
        private Continent continent() {
            return region.getCountry().getContinent();
        }

        private void assignTo(Attraction attraction) {
            if (city == null) {
                attraction.underRegion(region);
            } else {
                attraction.underCity(city);
            }
        }
    }

}