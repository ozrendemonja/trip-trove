package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionCategory;

public enum AttractionCategoryDTO {
    // Landmark group
    POINT_OF_INTEREST_AND_LANDMARK, HISTORIC_SITE, RELIGIOUS_SITE, ARENA_AND_STADIUM, OTHER_LANDMARK,
    // Museum group
    SPECIALITY_MUSEUM, ART_MUSEUM, HISTORY_MUSEUM, SCIENCE_MUSEUM, OTHER_MUSEUM,
    // Nature and park group
    PARK, NATURE_AND_WILDLIFE_AREA, OTHER_NATURE_AND_PARK,
    // Outdoor activity group
    LAND_BASED_ACTIVITY, AIR_BASED_ACTIVITY, WATER_BASED_ACTIVITY, OTHER_OUTDOOR_ACTIVITY,
    // Event group
    SPORTING_EVENT, CULTURAL_EVENT, THEATRE_EVENT, OTHER_EVENT,
    // Shopping group
    SHOPPING,
    // Zoo and aquarium group
    ZOO_AND_AQUARIUM,
    // Nightlife group
    NIGHTLIFE,
    // Food and drink group
    FOOD, DRINK,
    // Tour group
    WILDLIFE_TOUR, EXTREME_SPORT_TOUR, OTHER_TOUR,
    // Fun and game group
    WATER_AND_AMUSEMENT_PARK, FILM_AND_TV_TOUR, CLASS_AND_WORKSHOP, OTHER_FUN_AND_GAME,
    // Spa and wellness group
    SPA_AND_WELLNESS,
    // Eatery and beverage_spot group
    EATERY, BEVERAGE_SPOT;

    public AttractionCategory toAttractionCategory() {
        return switch (this) {
            case POINT_OF_INTEREST_AND_LANDMARK -> AttractionCategory.POINT_OF_INTEREST_AND_LANDMARK;
            case HISTORIC_SITE -> AttractionCategory.HISTORIC_SITE;
            case RELIGIOUS_SITE -> AttractionCategory.RELIGIOUS_SITE;
            case ARENA_AND_STADIUM -> AttractionCategory.ARENA_AND_STADIUM;
            case OTHER_LANDMARK -> AttractionCategory.OTHER_LANDMARK;
            case SPECIALITY_MUSEUM -> AttractionCategory.SPECIALITY_MUSEUM;
            case ART_MUSEUM -> AttractionCategory.ART_MUSEUM;
            case HISTORY_MUSEUM -> AttractionCategory.HISTORY_MUSEUM;
            case SCIENCE_MUSEUM -> AttractionCategory.SCIENCE_MUSEUM;
            case OTHER_MUSEUM -> AttractionCategory.OTHER_MUSEUM;
            case PARK -> AttractionCategory.PARK;
            case NATURE_AND_WILDLIFE_AREA -> AttractionCategory.NATURE_AND_WILDLIFE_AREA;
            case OTHER_NATURE_AND_PARK -> AttractionCategory.OTHER_NATURE_AND_PARK;
            case LAND_BASED_ACTIVITY -> AttractionCategory.LAND_BASED_ACTIVITY;
            case AIR_BASED_ACTIVITY -> AttractionCategory.AIR_BASED_ACTIVITY;
            case WATER_BASED_ACTIVITY -> AttractionCategory.WATER_BASED_ACTIVITY;
            case OTHER_OUTDOOR_ACTIVITY -> AttractionCategory.OTHER_OUTDOOR_ACTIVITY;
            case SPORTING_EVENT -> AttractionCategory.SPORTING_EVENT;
            case CULTURAL_EVENT -> AttractionCategory.CULTURAL_EVENT;
            case THEATRE_EVENT -> AttractionCategory.THEATRE_EVENT;
            case OTHER_EVENT -> AttractionCategory.OTHER_EVENT;
            case SHOPPING -> AttractionCategory.SHOPPING;
            case ZOO_AND_AQUARIUM -> AttractionCategory.ZOO_AND_AQUARIUM;
            case NIGHTLIFE -> AttractionCategory.NIGHTLIFE;
            case FOOD -> AttractionCategory.FOOD;
            case DRINK -> AttractionCategory.DRINK;
            case WILDLIFE_TOUR -> AttractionCategory.WILDLIFE_TOUR;
            case EXTREME_SPORT_TOUR -> AttractionCategory.EXTREME_SPORT_TOUR;
            case OTHER_TOUR -> AttractionCategory.OTHER_TOUR;
            case WATER_AND_AMUSEMENT_PARK -> AttractionCategory.WATER_AND_AMUSEMENT_PARK;
            case FILM_AND_TV_TOUR -> AttractionCategory.FILM_AND_TV_TOUR;
            case CLASS_AND_WORKSHOP -> AttractionCategory.CLASS_AND_WORKSHOP;
            case OTHER_FUN_AND_GAME -> AttractionCategory.OTHER_FUN_AND_GAME;
            case SPA_AND_WELLNESS -> AttractionCategory.SPA_AND_WELLNESS;
            case EATERY -> AttractionCategory.EATERY;
            case BEVERAGE_SPOT -> AttractionCategory.BEVERAGE_SPOT;
        };
    }
}