package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.ScrollPosition;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RegionRepo extends JpaRepository<Region, Integer> {
    @Query("SELECT COUNT(r) > 0 FROM Region r WHERE r.name = :name AND r.country.id = :countryId AND (:excludeId IS NULL OR r.id <> :excludeId)")
    boolean isNameAlreadyUsedInCountry(String name, int countryId, Integer excludeId);

    default boolean isNameAlreadyUsedInCountry(String name, int countryId) {
        return isNameAlreadyUsedInCountry(name, countryId, null);
    }

    default boolean isNameAlreadyUsedInCountry(Region region, int countryId) {
        return isNameAlreadyUsedInCountry(region.getName(), countryId, region.getId());
    }

    List<Region> findByName(String name);

    @EntityGraph(attributePaths = "country")
    @Query("""
            SELECT r FROM Region r
            ORDER BY coalesce(r.updatedOn, r.createdOn) ASC, r.id ASC
            """)
    List<Region> findAllOrderByOldest(Limit limit);

    @EntityGraph(attributePaths = "country")
    @Query("""
            SELECT r FROM Region r
            ORDER BY coalesce(r.updatedOn, r.createdOn) DESC, r.id DESC
            """)
    List<Region> findAllOrderByNewest(Limit limit);

    @EntityGraph(attributePaths = "country")
    @Query("""
            SELECT r FROM Region r
            WHERE coalesce(r.updatedOn, r.createdOn) > :#{#afterRegion.updatedOn}
               OR (coalesce(r.updatedOn, r.createdOn) = :#{#afterRegion.updatedOn} AND r.id > :#{#afterRegion.elementId})
            ORDER BY coalesce(r.updatedOn, r.createdOn) ASC, r.id ASC
            """)
    List<Region> findOldestAfter(ScrollPosition afterRegion, Limit limit);

    @EntityGraph(attributePaths = "country")
    @Query("""
            SELECT r FROM Region r
            WHERE coalesce(r.updatedOn, r.createdOn) < :#{#afterRegion.updatedOn}
               OR (coalesce(r.updatedOn, r.createdOn) = :#{#afterRegion.updatedOn} AND r.id < :#{#afterRegion.elementId})
            ORDER BY coalesce(r.updatedOn, r.createdOn) DESC, r.id DESC
            """)
    List<Region> findNewestBefore(ScrollPosition afterRegion, Limit limit);

    default List<Suggestion> searchRegionSuggestions(String query, Limit limit) {
        return searchRegionSuggestions(query, null, limit);
    }

    default List<Suggestion> searchRegionSuggestions(String query, Integer countryId, Limit limit) {
        String searchText = query.replace(',', ' ').strip();
        if (searchText.isEmpty()) {
            return List.of();
        }
        String[] terms = searchText.replace("!", "!!").replace("%", "!%").replace("_", "!_").split("\\s+");
        return findByRegionAndCountryNames("%" + terms[0] + "%", "%" + String.join("%", terms) + "%", countryId, limit);
    }

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(
                    CASE WHEN :countryId IS NULL THEN CONCAT(r.name, ', ', c.name) ELSE r.name END, r.id)
            FROM Region r
            INNER JOIN r.country c
            WHERE (:countryId IS NULL OR c.id = :countryId)
            AND cast(function('normalize_search_text', r.name) as string) LIKE :regionQuery ESCAPE '!'
            AND cast(function('normalize_search_text', CONCAT(r.name, ' ', c.name)) as string) LIKE :query ESCAPE '!'
            AND (cast(function('normalize_search_text', r.name) as string) LIKE :query ESCAPE '!'
                    OR cast(function('normalize_search_text', c.name) as string) NOT LIKE :query ESCAPE '!')
            ORDER BY coalesce(r.updatedOn, r.createdOn) DESC
            """)
    List<Suggestion> findByRegionAndCountryNames(String regionQuery, String query, Integer countryId, Limit limit);

    @Query("SELECT COUNT(c)>0 FROM City c INNER JOIN c.region r WHERE r.id = :id")
    boolean hasCitiesUnder(Integer id);

    @Query("SELECT COUNT(a)>0 FROM Region r INNER JOIN r.attractions a WHERE r.id = :id")
    boolean hasAttractionsUnder(Integer id);
}