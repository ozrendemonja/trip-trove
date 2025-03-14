package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AttractionRepo extends JpaRepository<Attraction, Long>, JpaSpecificationExecutor<Attraction> {
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
            SELECT new com.triptrove.manager.domain.model.Suggestion(a.name, CAST(a.id AS int)) 
            FROM Attraction a
            WHERE lower(a.name) LIKE lower(concat('%', :query,'%'))
            ORDER BY coalesce(a.updatedOn, a.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(a.name, CAST(a.id AS int)) 
            FROM Attraction a
            WHERE lower(a.name) LIKE lower(concat('%', :query,'%'))
            AND a.country.id = :countryId
            ORDER BY coalesce(a.updatedOn, a.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Integer countryId, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(mainA.name, CAST(mainA.id AS int))
            FROM Attraction mainA 
            INNER JOIN mainA.attractions a 
            WHERE lower(mainA.name) LIKE lower(concat('%', :query,'%'))
            ORDER BY coalesce(mainA.updatedOn, mainA.createdOn) DESC
            """)
    List<Suggestion> findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(mainA.name, CAST(mainA.id AS int))
            FROM Attraction mainA 
            INNER JOIN mainA.attractions a 
            WHERE lower(mainA.name) LIKE lower(concat('%', :query,'%'))
            AND a.country.id = :countryId
            ORDER BY coalesce(mainA.updatedOn, mainA.createdOn) DESC
            """)
    List<Suggestion> findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Integer countryId, Limit limit);

    @Query("SELECT COUNT(a)>0 FROM Attraction mainA INNER JOIN mainA.attractions a WHERE mainA.id = :id")
    boolean isMainAttraction(Long id);
}