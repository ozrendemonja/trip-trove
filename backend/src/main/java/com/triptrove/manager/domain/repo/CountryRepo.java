package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CountryRepo extends JpaRepository<Country, Integer> {
    List<Country> findByName(String name);

    @Query("""
            SELECT c FROM Country c
            WHERE c.id > :#{#afterCountry.elementId} AND c.createdOn >= :#{#afterCountry.updatedOn}
            ORDER BY coalesce(c.updatedOn, c.createdOn) ASC
            """)
    List<Country> findOldestAfter(@Param("afterCountry") ScrollPosition afterCountry, Limit limit);

    @Query("""
            SELECT c FROM Country c
            WHERE c.id < :#{#afterCountry.elementId} AND c.createdOn <= :#{#afterCountry.updatedOn}
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Country> findNewestBefore(@Param("afterCountry") ScrollPosition afterCountry, Limit limit);

    @Query("""
            SELECT c FROM Country c
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Country> findAllOrderByNewest(Limit limit);

    @Query("""
            SELECT c FROM Country c
            ORDER BY coalesce(c.updatedOn, c.createdOn) ASC
            """)
    List<Country> findAllOrderByOldest(Limit limit);

    boolean existsByNameAndContinentName(String countryName, String continentName);

    void deleteById(Integer id);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(c.name, c.id) 
            FROM Country c 
            WHERE lower(c.name) LIKE lower(concat('%', :query,'%'))
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("SELECT COUNT(r)>0 FROM Region r INNER JOIN r.country c WHERE c.id = :id")
    boolean hasRegionsUnder(Integer id);
}