package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.City;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CityRepo extends JpaRepository<City, Integer> {

    boolean existsByNameAndRegionId(String name, int regionId);

    List<City> findByName(String name);

    @Query("""
            SELECT c FROM City c
            ORDER BY c.createdOn ASC
            """)
    List<City> findAllOrderByOldest(Limit limit);

    @Query("""
            SELECT c FROM City c
            ORDER BY c.createdOn DESC
            """)
    List<City> findAllOrderByNewest(Limit limit);

    @Query("""
            SELECT c FROM City c
            WHERE c.id > :#{#afterCity.elementId} AND c.createdOn >= :#{#afterCity.updatedOn}
            ORDER BY c.createdOn ASC
            """)
    List<City> findOldestAfter(ScrollPosition afterCity, Limit limit);

    @Query("""
            SELECT c FROM City c
            WHERE c.id < :#{#afterCity.elementId} AND c.createdOn <= :#{#afterCity.updatedOn}
            ORDER BY c.createdOn DESC
            """)
    List<City> findNewestBefore(ScrollPosition afterCity, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(c.name, c.id)
            FROM City c
            WHERE lower(c.name) LIKE lower(concat('%', :query,'%'))
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("SELECT COUNT(a)>0 FROM City c INNER JOIN c.attractions a WHERE c.id = :id")
    boolean hasAttractionsUnder(Integer id);
}
