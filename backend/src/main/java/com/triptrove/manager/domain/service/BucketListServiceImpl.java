package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.BucketListItem;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;
import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.Trip;
import com.triptrove.manager.domain.repo.BucketListItemRepo;
import com.triptrove.manager.domain.repo.CityRepo;
import com.triptrove.manager.domain.repo.RegionRepo;
import com.triptrove.manager.domain.repo.TripRepo;
import com.triptrove.manager.infra.ManagerProperties;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@AllArgsConstructor
@Service
@Log4j2
public class BucketListServiceImpl implements BucketListService {
    private final ManagerProperties managerProperties;
    private final BucketListItemRepo bucketListItemRepo;
    private final CityRepo cityRepo;
    private final RegionRepo regionRepo;
    private final TripRepo tripRepo;

    @Override
    public BucketListItem saveItem(String name, Integer cityId, Integer regionId, String description) {
        log.atInfo().log("Saving bucket list item: name='{}'", name);
        validateCityAndRegionAreMutuallyExclusive(cityId, regionId);

        var city = findCity(cityId);
        var region = findRegion(regionId);

        var item = new BucketListItem();
        item.setName(name);
        item.setCity(city);
        item.setRegion(region);
        item.setDescription(description);

        var savedItem = bucketListItemRepo.save(item);
        log.atInfo().log("Bucket list item saved: id={}, name='{}'", savedItem.getId(), savedItem.getName());
        return savedItem;
    }

    @Override
    public List<BucketListItem> getItems(ScrollPosition afterItem, SortDirection sortDirection) {
        log.atInfo().log("Getting bucket list items: sortDirection={}, afterItemId={}, afterUpdatedOn={}, pageSize={}",
                sortDirection,
                afterItem == null ? null : afterItem.elementId(),
                afterItem == null ? null : afterItem.updatedOn(),
                managerProperties.pageSize());

        List<BucketListItem> items;
        if (sortDirection == SortDirection.ASCENDING) {
            items = getItemsAfter(afterItem);
        } else {
            items = getItemsBefore(afterItem);
        }

        log.atInfo().log("Found {} bucket list items", items.size());
        return items;
    }

    private List<BucketListItem> getItemsAfter(ScrollPosition item) {
        if (item == null) {
            return bucketListItemRepo.findAllOrderByOldest(Limit.of(managerProperties.pageSize()));
        }
        return bucketListItemRepo.findOldestAfter(item, Limit.of(managerProperties.pageSize()));
    }

    private List<BucketListItem> getItemsBefore(ScrollPosition item) {
        if (item == null) {
            return bucketListItemRepo.findAllOrderByNewest(Limit.of(managerProperties.pageSize()));
        }
        return bucketListItemRepo.findNewestBefore(item, Limit.of(managerProperties.pageSize()));
    }

    @Override
    public BucketListItem getItem(long id) {
        log.atInfo().log("Getting bucket list item: id={}", id);
        var item = findItem(id);
        log.atInfo().log("Bucket list item found: id={}, name='{}'", item.getId(), item.getName());
        return item;
    }

    @Override
    public void updateItemName(long id, String name) {
        log.atInfo().log("Updating bucket list item name: id={}, name='{}'", id, name);

        var item = findItem(id);
        item.setName(name);
        bucketListItemRepo.save(item);
        log.atInfo().log("Bucket list item name updated: id={}, name='{}'", id, name);
    }

    @Override
    public void updateItemLocation(long id, Integer cityId, Integer regionId) {
        log.atInfo().log("Updating bucket list item location: id={}", id);
        validateCityAndRegionAreMutuallyExclusive(cityId, regionId);

        var city = findCity(cityId);
        var region = findRegion(regionId);

        var item = findItem(id);
        item.setCity(city);
        item.setRegion(region);
        bucketListItemRepo.save(item);
        log.atInfo().log("Bucket list item location updated: id={}", id);
    }

    @Override
    public void updateItemDescription(long id, String description) {
        log.atInfo().log("Updating bucket list item description: id={}", id);

        var item = findItem(id);
        item.setDescription(description);
        bucketListItemRepo.save(item);
        log.atInfo().log("Bucket list item description updated: id={}", id);
    }

    @Override
    public void updateItemCompletion(long id, LocalDate completedOn, Long tripId) {
        log.atInfo().log("Updating bucket list item completion: id={}, completedOn={}, tripId={}",
                id, completedOn, tripId);
        validateTripAndCompletionDateAreProvidedTogether(completedOn, tripId);

        var trip = findTrip(tripId);
        validateCompletionDateIsWithinTrip(completedOn, trip);

        var item = findItem(id);
        item.setCompletedOn(completedOn);
        item.setTrip(trip);
        bucketListItemRepo.save(item);
        log.atInfo().log("Bucket list item completion updated: id={}", id);
    }

    @Override
    public void deleteItem(long id) {
        log.atInfo().log("Deleting bucket list item: id={}", id);
        var item = findItem(id);
        bucketListItemRepo.delete(item);
        log.atInfo().log("Bucket list item deleted: id={}, name='{}'", item.getId(), item.getName());
    }

    private BucketListItem findItem(long id) {
        return bucketListItemRepo.findById(id)
                .orElseThrow(() -> new BaseApiException(
                        "Bucket list item with id '%d' not found".formatted(id),
                        BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

    private void validateCityAndRegionAreMutuallyExclusive(Integer cityId, Integer regionId) {
        if (cityId != null && regionId != null) {
            throw new BaseApiException(
                    "Bucket list item cannot reference both city '%d' and region '%d'".formatted(cityId, regionId),
                    BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private void validateTripAndCompletionDateAreProvidedTogether(LocalDate completedOn, Long tripId) {
        if ((tripId == null) != (completedOn == null)) {
            var message = tripId == null
                    ? "Bucket list item completed on '%s' must reference a trip".formatted(completedOn)
                    : "Bucket list item assigned to trip '%d' must have a completion date".formatted(tripId);
            throw new BaseApiException(message, BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private void validateCompletionDateIsWithinTrip(LocalDate completedOn, Trip trip) {
        if (trip != null && (completedOn.isBefore(trip.getFrom()) || completedOn.isAfter(trip.getTo()))) {
            throw new BaseApiException(
                    "Completion date '%s' must be within trip '%d' date range '%s' to '%s'"
                            .formatted(completedOn, trip.getId(), trip.getFrom(), trip.getTo()),
                    BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private City findCity(Integer cityId) {
        if (cityId == null) {
            return null;
        }
        return cityRepo.findById(cityId)
                .orElseThrow(() -> new BaseApiException(
                        "City with id '%d' not found in the database".formatted(cityId),
                        BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

    private Region findRegion(Integer regionId) {
        if (regionId == null) {
            return null;
        }
        return regionRepo.findById(regionId)
                .orElseThrow(() -> new BaseApiException(
                        "Region with id '%d' not found in the database".formatted(regionId),
                        BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

    private Trip findTrip(Long tripId) {
        if (tripId == null) {
            return null;
        }
        return tripRepo.findById(tripId)
                .orElseThrow(() -> new BaseApiException(
                        "Trip with id '%d' not found in the database".formatted(tripId),
                        BaseApiException.ErrorCode.OBJECT_NOT_FOUND));
    }

}