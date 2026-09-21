package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.BucketListItem;
import com.triptrove.manager.domain.model.BucketListItemDetails;
import com.triptrove.manager.domain.model.ScrollPosition;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BucketListItemRepo extends JpaRepository<BucketListItem, Long> {
    @Query("""
            SELECT new com.triptrove.manager.domain.model.BucketListItemDetails(
                item.id, item.name, item.completedOn, item.wouldRepeat, city.id, city.name,
                region.id, coalesce(region.name, cityRegion.name), item.description, trip.id, trip.name,
                coalesce(item.updatedOn, item.createdOn))
            FROM BucketListItem item
            LEFT JOIN item.city city
            LEFT JOIN city.region cityRegion
            LEFT JOIN item.region region
            LEFT JOIN item.trip trip
            WHERE item.id = :id
            """)
    Optional<BucketListItemDetails> findDetailsById(long id);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.BucketListItemDetails(
                item.id, item.name, item.completedOn, item.wouldRepeat, city.id, city.name,
                region.id, coalesce(region.name, cityRegion.name), item.description, trip.id, trip.name,
                coalesce(item.updatedOn, item.createdOn))
            FROM BucketListItem item
            LEFT JOIN item.city city
            LEFT JOIN city.region cityRegion
            LEFT JOIN item.region region
            LEFT JOIN item.trip trip
            ORDER BY coalesce(item.updatedOn, item.createdOn) ASC, item.id ASC
            """)
    List<BucketListItemDetails> findAllOrderByOldest(Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.BucketListItemDetails(
                item.id, item.name, item.completedOn, item.wouldRepeat, city.id, city.name,
                region.id, coalesce(region.name, cityRegion.name), item.description, trip.id, trip.name,
                coalesce(item.updatedOn, item.createdOn))
            FROM BucketListItem item
            LEFT JOIN item.city city
            LEFT JOIN city.region cityRegion
            LEFT JOIN item.region region
            LEFT JOIN item.trip trip
            ORDER BY coalesce(item.updatedOn, item.createdOn) DESC, item.id DESC
            """)
    List<BucketListItemDetails> findAllOrderByNewest(Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.BucketListItemDetails(
                item.id, item.name, item.completedOn, item.wouldRepeat, city.id, city.name,
                region.id, coalesce(region.name, cityRegion.name), item.description, trip.id, trip.name,
                coalesce(item.updatedOn, item.createdOn))
            FROM BucketListItem item
            LEFT JOIN item.city city
            LEFT JOIN city.region cityRegion
            LEFT JOIN item.region region
            LEFT JOIN item.trip trip
            WHERE coalesce(item.updatedOn, item.createdOn) > :#{#afterItem.updatedOn}
               OR (coalesce(item.updatedOn, item.createdOn) = :#{#afterItem.updatedOn} AND item.id > :#{#afterItem.elementId})
            ORDER BY coalesce(item.updatedOn, item.createdOn) ASC, item.id ASC
            """)
    List<BucketListItemDetails> findOldestAfter(ScrollPosition afterItem, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.BucketListItemDetails(
                item.id, item.name, item.completedOn, item.wouldRepeat, city.id, city.name,
                region.id, coalesce(region.name, cityRegion.name), item.description, trip.id, trip.name,
                coalesce(item.updatedOn, item.createdOn))
            FROM BucketListItem item
            LEFT JOIN item.city city
            LEFT JOIN city.region cityRegion
            LEFT JOIN item.region region
            LEFT JOIN item.trip trip
            WHERE coalesce(item.updatedOn, item.createdOn) < :#{#afterItem.updatedOn}
               OR (coalesce(item.updatedOn, item.createdOn) = :#{#afterItem.updatedOn} AND item.id < :#{#afterItem.elementId})
            ORDER BY coalesce(item.updatedOn, item.createdOn) DESC, item.id DESC
            """)
    List<BucketListItemDetails> findNewestBefore(ScrollPosition afterItem, Limit limit);
}