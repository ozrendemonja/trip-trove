package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.BucketListItem;
import com.triptrove.manager.domain.model.ScrollPosition;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BucketListItemRepo extends JpaRepository<BucketListItem, Long> {
    @Query("""
        SELECT item FROM BucketListItem item
        ORDER BY coalesce(item.updatedOn, item.createdOn) ASC, item.id ASC
        """)
    List<BucketListItem> findAllOrderByOldest(Limit limit);

    @Query("""
        SELECT item FROM BucketListItem item
        ORDER BY coalesce(item.updatedOn, item.createdOn) DESC, item.id DESC
        """)
    List<BucketListItem> findAllOrderByNewest(Limit limit);

    @Query("""
        SELECT item FROM BucketListItem item
        WHERE coalesce(item.updatedOn, item.createdOn) > :#{#afterItem.updatedOn}
           OR (coalesce(item.updatedOn, item.createdOn) = :#{#afterItem.updatedOn} AND item.id > :#{#afterItem.elementId})
        ORDER BY coalesce(item.updatedOn, item.createdOn) ASC, item.id ASC
        """)
    List<BucketListItem> findOldestAfter(ScrollPosition afterItem, Limit limit);

    @Query("""
        SELECT item FROM BucketListItem item
        WHERE coalesce(item.updatedOn, item.createdOn) < :#{#afterItem.updatedOn}
           OR (coalesce(item.updatedOn, item.createdOn) = :#{#afterItem.updatedOn} AND item.id < :#{#afterItem.elementId})
        ORDER BY coalesce(item.updatedOn, item.createdOn) DESC, item.id DESC
        """)
    List<BucketListItem> findNewestBefore(ScrollPosition afterItem, Limit limit);
}