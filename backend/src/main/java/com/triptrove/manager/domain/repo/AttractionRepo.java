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

    @Query("SELECT COUNT(a) > 0 FROM Attraction a WHERE a.name = :name AND a.city.id = :cityId AND (:excludeId IS NULL OR a.id <> :excludeId)")
    boolean isNameAlreadyUsedInCity(String name, Integer cityId, Long excludeId);

    default boolean isNameAlreadyUsedInCity(String name, Integer cityId) {
        return isNameAlreadyUsedInCity(name, cityId, null);
    }

    default boolean isNameAlreadyUsedInCity(Attraction attraction, Integer cityId) {
        return isNameAlreadyUsedInCity(attraction.getName(), cityId, attraction.getId());
    }

    @Query("SELECT COUNT(a) > 0 FROM Attraction a WHERE a.name = :name AND a.region.id = :regionId AND (:excludeId IS NULL OR a.id <> :excludeId)")
    boolean isNameAlreadyUsedInRegion(String name, Integer regionId, Long excludeId);

    default boolean isNameAlreadyUsedInRegion(String name, Integer regionId) {
        return isNameAlreadyUsedInRegion(name, regionId, null);
    }

    default boolean isNameAlreadyUsedInRegion(Attraction attraction, Integer regionId) {
        return isNameAlreadyUsedInRegion(attraction.getName(), regionId, attraction.getId());
    }

    @Query("SELECT COUNT(a) > 0 FROM Attraction a WHERE a.name = :name AND a.main.id = :mainAttractionId AND (:excludeId IS NULL OR a.id <> :excludeId)")
    boolean isNameAlreadyUsedUnderMain(String name, Long mainAttractionId, Long excludeId);

    default boolean isNameAlreadyUsedUnderMain(String name, Long mainAttractionId) {
        return isNameAlreadyUsedUnderMain(name, mainAttractionId, null);
    }

    default boolean isNameAlreadyUsedUnderMain(Attraction attraction, Long mainAttractionId) {
        return isNameAlreadyUsedUnderMain(attraction.getName(), mainAttractionId, attraction.getId());
    }

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
            WHERE cast(function('normalize_search_text', a.name) as string) LIKE concat('%', :query,'%')
            ORDER BY coalesce(a.updatedOn, a.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(a.name, CAST(a.id AS int)) 
            FROM Attraction a
            WHERE cast(function('normalize_search_text', a.name) as string) LIKE concat('%', :query,'%')
            AND a.country.id = :countryId
            ORDER BY coalesce(a.updatedOn, a.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Integer countryId, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(mainA.name, CAST(mainA.id AS int))
            FROM Attraction mainA 
            INNER JOIN mainA.attractions a 
            WHERE cast(function('normalize_search_text', mainA.name) as string) LIKE concat('%', :query,'%')
            ORDER BY coalesce(mainA.updatedOn, mainA.createdOn) DESC
            """)
    List<Suggestion> findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(mainA.name, CAST(mainA.id AS int))
            FROM Attraction mainA 
            INNER JOIN mainA.attractions a 
            WHERE cast(function('normalize_search_text', mainA.name) as string) LIKE concat('%', :query,'%')
            AND a.country.id = :countryId
            ORDER BY coalesce(mainA.updatedOn, mainA.createdOn) DESC
            """)
    List<Suggestion> findMainAttractionByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Integer countryId, Limit limit);

    @Query("SELECT COUNT(a)>0 FROM Attraction mainA INNER JOIN mainA.attractions a WHERE mainA.id = :id")
    boolean isMainAttraction(Long id);
}