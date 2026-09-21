package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.AttractionDetails;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public interface AttractionDetailsRepo {
    List<AttractionDetails> findMatchingAttractions(Specification<Attraction> specification, Limit limit);
}