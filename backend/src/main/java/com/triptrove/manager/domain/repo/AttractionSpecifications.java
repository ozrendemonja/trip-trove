package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.*;
import com.triptrove.manager.domain.search.SearchTextNormalizer;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

@Log4j2
public class AttractionSpecifications {
    private AttractionSpecifications() {
    }

    public static Specification<Attraction> newestAttractionsUnderContinent(String continentName) {
        return (root, query, cb) -> {
            Join<Attraction, Country> subqueryContinent = root.join("country");
            orderByNewest(root, query, cb);

            return cb.and(cb.equal(subqueryContinent.get("continent").get("name"), continentName));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderCountry(Integer countryId) {
        return (root, query, cb) -> {
            orderByNewest(root, query, cb);
            return cb.and(cb.equal(root.get("country").get("id"), countryId));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderRegion(Integer regionId) {
        return (root, query, cb) -> {
            orderByNewest(root, query, cb);
            return cb.and(cb.equal(root.get("region").get("id"), regionId));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderCity(Integer cityId) {
        return (root, query, cb) -> {
            orderByNewest(root, query, cb);
            return cb.and(cb.equal(root.get("city").get("id"), cityId));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderMainAttraction(Long mainAttractionId) {
        return (root, query, cb) -> {
            orderByNewest(root, query, cb);
            return cb.and(cb.equal(root.get("main").get("id"), mainAttractionId));
        };
    }

    public static Specification<Attraction> isBefore(ScrollPosition beforeAttraction) {
        return (root, query, cb) -> {
            var changedOn = effectiveChangedOn(root, cb);
            return cb.or(
                    cb.lessThan(changedOn, beforeAttraction.updatedOn()),
                    cb.and(cb.equal(changedOn, beforeAttraction.updatedOn()),
                            cb.lessThan(root.<Long>get("id"), beforeAttraction.elementId())));
        };
    }

    private static void orderByNewest(Root<Attraction> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        query.orderBy(cb.desc(effectiveChangedOn(root, cb)), cb.desc(root.get("id")));
    }

    private static Expression<LocalDateTime> effectiveChangedOn(Root<Attraction> root, CriteriaBuilder cb) {
        return cb.coalesce(root.get("updatedOn"), root.get("createdOn"));
    }

    private static Specification<Attraction> filterCountrywide(boolean isCountrywide) {
        return (root, query, cb) -> cb.equal(root.get("isCountrywide"), isCountrywide);
    }

    private static Specification<Attraction> filterCategory(AttractionCategory category) {
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    private static Specification<Attraction> filterType(AttractionType type) {
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    private static Specification<Attraction> filterMustVisit(boolean mustVisit) {
        return (root, query, cb) -> cb.equal(root.get("mustVisit"), mustVisit);
    }

    private static Specification<Attraction> filterTraditional(boolean isTraditional) {
        return (root, query, cb) -> cb.equal(root.get("isTraditional"), isTraditional);
    }

    private static Specification<Attraction> searchName(String nameQuery) {
        return (root, query, cb) -> cb.like(normalizeForSearch(root.get("name"), cb), "%" + SearchTextNormalizer.normalizeForSearch(nameQuery) + "%");
    }

    private static Specification<Attraction> searchTip(String tipQuery) {
        return (root, query, cb) -> cb.like(normalizeForSearch(root.get("tip"), cb), "%" + SearchTextNormalizer.normalizeForSearch(tipQuery) + "%");
    }

    private static Specification<Attraction> searchSourceName(String sourceNameQuery) {
        return (root, query, cb) -> cb.like(normalizeForSearch(root.get("informationProvider").get("sourceName"), cb), "%" + SearchTextNormalizer.normalizeForSearch(sourceNameQuery) + "%");
    }

    private static Expression<String> normalizeForSearch(Expression<String> value, CriteriaBuilder cb) {
        return cb.function(SearchTextNormalizer.SQL_FUNCTION_NAME, String.class, value);
    }

    public static Specification<Attraction> applyFilters(AttractionFilter filters) {
        Specification<Attraction> result = Specification.allOf();
        if (filters.isCountrywide() != null) {
            log.atDebug().log("isCountrywide filter applied");
            result = result.and(filterCountrywide(filters.isCountrywide()));
        }
        if (filters.isTraditional() != null) {
            log.atDebug().log("isTraditional filter applied");
            result = result.and(filterTraditional(filters.isTraditional()));
        }
        if (filters.mustVisit() != null) {
            log.atDebug().log("mustVisit filter applied");
            result = result.and(filterMustVisit(filters.mustVisit()));
        }
        if (filters.type() != null) {
            log.atDebug().log("type filter applied");
            result = result.and(filterType(filters.type()));
        }
        if (filters.category() != null) {
            log.atDebug().log("category filter applied");
            result = result.and(filterCategory(filters.category()));
        }
        if (filters.query() != null) {
            log.atDebug().log("Search by query '{}'", filters.query());
            Specification<Attraction> searchSpec = searchSourceName(filters.query()).or(searchName(filters.query())).or(searchTip(filters.query()));
            result = result.and(searchSpec);
        }
        return result;
    }
}
