package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.jpa.domain.Specification;

@Log4j2
public class AttractionSpecifications {

    private AttractionSpecifications() {
    }

    public static Specification<Attraction> newestAttractionsUnderContinent(String continentName) {
        return (root, query, cb) -> {
            Join<Attraction, Country> subqueryContinent = root.join("country");
            query.orderBy(cb.desc(root.get("createdOn")));

            return cb.and(cb.equal(subqueryContinent.get("continent").get("name"), continentName));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderCountry(Integer countryId) {
        return (root, query, cb) -> {
            query.orderBy(cb.desc(root.get("createdOn")));
            return cb.and(cb.equal(root.get("country").get("id"), countryId));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderRegion(Integer regionId) {
        return (root, query, cb) -> {
            query.orderBy(cb.desc(root.get("createdOn")));
            return cb.and(cb.equal(root.get("region").get("id"), regionId));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderCity(Integer cityId) {
        return (root, query, cb) -> {
            Join<Attraction, City> subqueryCity = root.join("city", JoinType.RIGHT);
            query.orderBy(cb.desc(root.get("createdOn")));
            return cb.and(cb.equal(subqueryCity.get("id"), cityId));
        };
    }

    public static Specification<Attraction> newestAttractionsUnderMainAttraction(Long mainAttractionId) {
        return (root, query, cb) -> {
            query.orderBy(cb.desc(root.get("createdOn")));
            return cb.and(cb.equal(root.get("main").get("id"), mainAttractionId));
        };
    }

    public static Specification<Attraction> isBefore(ScrollPosition beforeAttraction) {
        return (root, query, cb) -> cb.and(
                cb.lessThan(root.get("id"), beforeAttraction.elementId()),
                cb.lessThanOrEqualTo(root.get("createdOn"), beforeAttraction.updatedOn())
        );
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
        return (root, query, cb) -> cb.like(root.get("name"), "%" + nameQuery + "%");
    }

    private static Specification<Attraction> searchTip(String tipQuery) {
        return (root, query, cb) -> cb.like(root.get("tip"), "%" + tipQuery + "%");
    }

    private static Specification<Attraction> searchSourceName(String sourceNameQuery) {
        return (root, query, cb) -> cb.like(root.get("informationProvider").get("sourceName"), "%" + sourceNameQuery + "%");
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
