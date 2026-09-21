package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.BucketListItem;
import com.triptrove.manager.domain.model.BucketListItemDetails;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.SortDirection;

import java.time.LocalDate;
import java.util.List;

public interface BucketListService {
    BucketListItem saveItem(String name, Integer cityId, Integer regionId, String description);

    List<BucketListItemDetails> getItems(ScrollPosition afterItem, SortDirection sortDirection);

    BucketListItemDetails getItem(long id);

    void updateItemName(long id, String name);

    void updateItemLocation(long id, Integer cityId, Integer regionId);

    void updateItemDescription(long id, String description);

    void updateItemCompletion(long id, LocalDate completedOn, Long tripId, Boolean wouldRepeat);

    void deleteItem(long id);
}