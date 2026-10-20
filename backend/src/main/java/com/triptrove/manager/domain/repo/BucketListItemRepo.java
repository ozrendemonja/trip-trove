package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.BucketListItem;
import com.triptrove.manager.domain.model.BucketListCountsSummary;
import com.triptrove.manager.domain.model.BucketListItemDetails;
import com.triptrove.manager.domain.model.BucketListStatusFilter;
import com.triptrove.manager.domain.model.ScrollPosition;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BucketListItemRepo extends JpaRepository<BucketListItem, Long> {
    @Query("""
            SELECT new com.triptrove.manager.domain.model.BucketListCountsSummary(
                count(item.id),
                count(item.completedOn))
            FROM BucketListItem item
            """)
    BucketListCountsSummary findCountsSummary();

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
            WHERE (:#{#statusFilter.includesTodo()} = true AND item.completedOn IS NULL)
               OR (:#{#statusFilter.includesCompleted()} = true AND item.completedOn IS NOT NULL)
            ORDER BY coalesce(item.updatedOn, item.createdOn) ASC, item.id ASC
            """)
    List<BucketListItemDetails> findAllOrderByOldest(BucketListStatusFilter statusFilter, Limit limit);

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
            WHERE (:#{#statusFilter.includesTodo()} = true AND item.completedOn IS NULL)
               OR (:#{#statusFilter.includesCompleted()} = true AND item.completedOn IS NOT NULL)
            ORDER BY coalesce(item.updatedOn, item.createdOn) DESC, item.id DESC
            """)
    List<BucketListItemDetails> findAllOrderByNewest(BucketListStatusFilter statusFilter, Limit limit);

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
            WHERE ((:#{#statusFilter.includesTodo()} = true AND item.completedOn IS NULL)
                OR (:#{#statusFilter.includesCompleted()} = true AND item.completedOn IS NOT NULL))
              AND (coalesce(item.updatedOn, item.createdOn) > :#{#afterItem.updatedOn}
                OR (coalesce(item.updatedOn, item.createdOn) = :#{#afterItem.updatedOn} AND item.id > :#{#afterItem.elementId}))
            ORDER BY coalesce(item.updatedOn, item.createdOn) ASC, item.id ASC
            """)
    List<BucketListItemDetails> findOldestAfter(
            ScrollPosition afterItem, BucketListStatusFilter statusFilter, Limit limit);

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
            WHERE ((:#{#statusFilter.includesTodo()} = true AND item.completedOn IS NULL)
                OR (:#{#statusFilter.includesCompleted()} = true AND item.completedOn IS NOT NULL))
              AND (coalesce(item.updatedOn, item.createdOn) < :#{#afterItem.updatedOn}
                OR (coalesce(item.updatedOn, item.createdOn) = :#{#afterItem.updatedOn} AND item.id < :#{#afterItem.elementId}))
            ORDER BY coalesce(item.updatedOn, item.createdOn) DESC, item.id DESC
            """)
    List<BucketListItemDetails> findNewestBefore(
            ScrollPosition afterItem, BucketListStatusFilter statusFilter, Limit limit);
}