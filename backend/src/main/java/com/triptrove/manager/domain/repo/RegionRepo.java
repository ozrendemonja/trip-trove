package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RegionRepo extends JpaRepository<Region, Integer> {
    boolean existsByNameAndCountryId(String name, int countryId);

    List<Region> findByName(String name);

    @Query("""
            SELECT r FROM Region r
            ORDER BY r.createdOn ASC
            """)
    List<Region> findAllOrderByOldest(Limit limit);

    @Query("""
            SELECT r FROM Region r
            ORDER BY r.createdOn DESC
            """)
    List<Region> findAllOrderByNewest(Limit limit);

    @Query("""
            SELECT r FROM Region r
            WHERE r.id > :#{#afterRegion.elementId} AND r.createdOn >= :#{#afterRegion.updatedOn}
            ORDER BY r.createdOn ASC
            """)
    List<Region> findOldestAfter(ScrollPosition afterRegion, Limit limit);

    @Query("""
            SELECT r FROM Region r
            WHERE r.id < :#{#afterRegion.elementId} AND r.createdOn <= :#{#afterRegion.updatedOn}
            ORDER BY r.createdOn DESC
            """)
    List<Region> findNewestBefore(ScrollPosition afterRegion, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(r.name, r.id) FROM Region r
            WHERE r.name LIKE %:query%
            ORDER BY coalesce(r.updatedOn, r.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);
}