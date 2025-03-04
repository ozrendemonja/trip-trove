package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AttractionRepo extends JpaRepository<Attraction, Long> {
    List<Attraction> findByName(String name);

    boolean existsByNameAndCityId(String name, Integer cityId);

    boolean existsByNameAndRegionId(String name, Integer regionId);

    boolean existsByNameAndMainId(String name, Long mainAttractionId);

    @Query("""
            SELECT a FROM Attraction a
            ORDER BY a.createdOn ASC
            """)
    List<Attraction> findAllOrderByOldest(Limit limit);

    @Query("""
            SELECT a FROM Attraction a
            ORDER BY a.createdOn DESC
            """)
    List<Attraction> findAllOrderByNewest(Limit limit);

    @Query("""
            SELECT a FROM Attraction a
            WHERE a.id > :#{#afterAttraction.elementId} AND a.createdOn >= :#{#afterAttraction.updatedOn}
            ORDER BY a.createdOn ASC
            """)
    List<Attraction> findOldestAfter(ScrollPosition afterAttraction, Limit limit);

    @Query("""
            SELECT a FROM Attraction a
            WHERE a.id < :#{#afterAttraction.elementId} AND a.createdOn <= :#{#afterAttraction.updatedOn}
            ORDER BY a.createdOn DESC
            """)
    List<Attraction> findNewestBefore(ScrollPosition afterAttraction, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(a.name, CAST(a.id AS int)) FROM Attraction a
            WHERE a.name LIKE %:query%
            ORDER BY coalesce(a.updatedOn, a.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);
}
