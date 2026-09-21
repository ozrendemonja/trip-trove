package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.ContinentName;
import com.triptrove.manager.domain.CountryName;
import com.triptrove.manager.domain.model.Country;
import com.triptrove.manager.domain.model.CountrySummary;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CountryRepo extends JpaRepository<Country, Integer> {
    List<Country> findByName(String name);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.CountrySummary(
                c.id, c.name, c.continent.name, c.isoCode, coalesce(c.updatedOn, c.createdOn))
            FROM Country c
            WHERE c.id = :id
            """)
    Optional<CountrySummary> findSummaryById(Integer id);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.CountrySummary(
                c.id, c.name, c.continent.name, c.isoCode, coalesce(c.updatedOn, c.createdOn))
            FROM Country c
            WHERE coalesce(c.updatedOn, c.createdOn) > :#{#afterCountry.updatedOn}
               OR (coalesce(c.updatedOn, c.createdOn) = :#{#afterCountry.updatedOn} AND c.id > :#{#afterCountry.elementId})
            ORDER BY coalesce(c.updatedOn, c.createdOn) ASC, c.id ASC
            """)
    List<CountrySummary> findOldestAfter(@Param("afterCountry") ScrollPosition afterCountry, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.CountrySummary(
                c.id, c.name, c.continent.name, c.isoCode, coalesce(c.updatedOn, c.createdOn))
            FROM Country c
            WHERE coalesce(c.updatedOn, c.createdOn) < :#{#afterCountry.updatedOn}
               OR (coalesce(c.updatedOn, c.createdOn) = :#{#afterCountry.updatedOn} AND c.id < :#{#afterCountry.elementId})
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC, c.id DESC
            """)
    List<CountrySummary> findNewestBefore(@Param("afterCountry") ScrollPosition afterCountry, Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.CountrySummary(
                c.id, c.name, c.continent.name, c.isoCode, coalesce(c.updatedOn, c.createdOn))
            FROM Country c
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC, c.id DESC
            """)
    List<CountrySummary> findAllOrderByNewest(Limit limit);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.CountrySummary(
                c.id, c.name, c.continent.name, c.isoCode, coalesce(c.updatedOn, c.createdOn))
            FROM Country c
            ORDER BY coalesce(c.updatedOn, c.createdOn) ASC, c.id ASC
            """)
    List<CountrySummary> findAllOrderByOldest(Limit limit);

    @Query("""
            SELECT COUNT(c) > 0 FROM Country c 
            WHERE c.name = :#{#countryName.name()} AND c.continent.name = :#{#continentName.name()} AND (:excludeId IS NULL OR c.id <> :excludeId)
            """)
    boolean isNameAlreadyUsedInContinent(CountryName countryName, ContinentName continentName, Integer excludeId);

    default boolean isNameAlreadyUsedInContinent(CountryName countryName, ContinentName continentName) {
        return isNameAlreadyUsedInContinent(countryName, continentName, null);
    }

    @Query("""
            SELECT COUNT(c) > 0
            FROM Country c
            WHERE lower(c.isoCode) = lower(:isoCode) AND (:excludeId IS NULL OR c.id <> :excludeId)
            """)
    boolean isIsoCodeAlreadyUsed(String isoCode, Integer excludeId);

    default boolean isIsoCodeAlreadyUsed(String isoCode) {
        return isIsoCodeAlreadyUsed(isoCode, null);
    }

    void deleteById(Integer id);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(c.name, c.id) 
            FROM Country c 
            WHERE cast(function('normalize_search_text', c.name) as string) LIKE concat('%', :query,'%')
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("SELECT COUNT(r)>0 FROM Region r INNER JOIN r.country c WHERE c.id = :id")
    boolean hasRegionsUnder(Integer id);
}