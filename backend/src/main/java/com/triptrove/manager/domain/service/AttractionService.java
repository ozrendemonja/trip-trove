package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.*;

import java.time.LocalDate;
import java.util.List;

public interface AttractionService {
    Attraction saveAttraction(Integer regionId, Integer cityId, Long mainAttractionId, Attraction attraction);

    List<Attraction> getAttractions(SortDirection sortDirection);

    List<Attraction> getAttractions(ScrollPosition afterAttraction, SortDirection sortDirection);

    void deleteAttraction(Long id);

    Attraction getAttraction(Long id);

    void updateAttractionDestination(long id, boolean countrywide, Integer cityId, Integer regionId);

    void updateAttractionDetail(long id, String attractionName, Long mainAttractionId);

    void updateAttractionTraditional(long id, boolean isTraditional);

    void updateAttractionLocation(long id, String address, Double latitude, Double longitude);

    void updateAttractionCategory(long id, AttractionCategory attractionCategory);

    void updateAttractionType(long id, AttractionType attractionType);

    void updateAttractionVisit(long id, Boolean mustVisit);

    void updateAttractionTip(long id, String tip);

    void updateAttractionVisitPeriod(long id, VisitPeriod visitPeriod);

    void updateAttractionInformationProvider(long id, String infoFrom, LocalDate infoRecorded);
}