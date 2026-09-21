package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.AttractionDetails;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.JoinType;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@AllArgsConstructor
@Transactional(readOnly = true)
public class AttractionDetailsRepoImpl implements AttractionDetailsRepo {
    private final EntityManager entityManager;

    @Override
    public List<AttractionDetails> findMatchingAttractions(Specification<Attraction> specification, Limit limit) {
        var builder = entityManager.getCriteriaBuilder();
        var criteria = builder.createQuery(AttractionDetails.class);
        var attraction = criteria.from(Attraction.class);
        var city = attraction.join("city", JoinType.LEFT);
        var mainAttraction = attraction.join("main", JoinType.LEFT);

        criteria.select(builder.construct(AttractionDetails.class,
                attraction.get("id"),
                attraction.get("name"),
                city.get("name"),
                attraction.get("region").get("name"),
                attraction.get("country").get("name"),
                attraction.get("isCountrywide"),
                mainAttraction.get("name"),
                attraction.get("address"),
                attraction.get("category"),
                attraction.get("type"),
                attraction.get("mustVisit"),
                attraction.get("isTraditional"),
                attraction.get("tip"),
                attraction.get("informationProvider").get("sourceName"),
                attraction.get("recorded"),
                attraction.get("optimalVisitPeriod"),
                attraction.get("permanentlyClosedAt"),
                builder.coalesce(attraction.get("updatedOn"), attraction.get("createdOn"))));

        var predicate = specification.toPredicate(attraction, criteria, builder);
        if (predicate != null) {
            criteria.where(predicate);
        }
        var query = entityManager.createQuery(criteria);
        if (limit.isLimited()) {
            query.setMaxResults(limit.max());
        }
        return query.getResultList();
    }
}