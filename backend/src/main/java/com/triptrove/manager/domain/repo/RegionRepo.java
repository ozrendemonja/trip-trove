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
            SELECT new com.triptrove.manager.domain.model.Suggestion(CONCAT(r.name, ', ', c.name), r.id)
            FROM Region r
            INNER JOIN r.country c
            WHERE lower(r.name) LIKE lower(concat('%', :query,'%'))
            ORDER BY coalesce(r.updatedOn, r.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(r.name, r.id)
            FROM Region r
            WHERE lower(r.name) LIKE lower(concat('%', :query,'%'))
            AND r.country.id = :countryId
            ORDER BY coalesce(r.updatedOn, r.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Integer countryId, Limit limit);

    @Query("SELECT COUNT(c)>0 FROM City c INNER JOIN c.region r WHERE r.id = :id")
    boolean hasCitiesUnder(Integer id);

    @Query("SELECT COUNT(a)>0 FROM Region r INNER JOIN r.attractions a WHERE r.id = :id")
    boolean hasAttractionsUnder(Integer id);
}