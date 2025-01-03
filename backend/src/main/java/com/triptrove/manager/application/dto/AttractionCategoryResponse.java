package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionCategory;

public enum AttractionCategoryResponse {
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

    public static AttractionCategoryResponse from(AttractionCategory category) {
        return switch (category) {
            case POINT_OF_INTEREST_AND_LANDMARK -> AttractionCategoryResponse.POINT_OF_INTEREST_AND_LANDMARK;
            case HISTORIC_SITE -> AttractionCategoryResponse.HISTORIC_SITE;
            case RELIGIOUS_SITE -> AttractionCategoryResponse.RELIGIOUS_SITE;
            case ARENA_AND_STADIUM -> AttractionCategoryResponse.ARENA_AND_STADIUM;
            case OTHER_LANDMARK -> AttractionCategoryResponse.OTHER_LANDMARK;
            case SPECIALITY_MUSEUM -> AttractionCategoryResponse.SPECIALITY_MUSEUM;
            case ART_MUSEUM -> AttractionCategoryResponse.ART_MUSEUM;
            case HISTORY_MUSEUM -> AttractionCategoryResponse.HISTORY_MUSEUM;
            case SCIENCE_MUSEUM -> AttractionCategoryResponse.SCIENCE_MUSEUM;
            case OTHER_MUSEUM -> AttractionCategoryResponse.OTHER_MUSEUM;
            case PARK -> AttractionCategoryResponse.PARK;
            case NATURE_AND_WILDLIFE_AREA -> AttractionCategoryResponse.NATURE_AND_WILDLIFE_AREA;
            case OTHER_NATURE_AND_PARK -> AttractionCategoryResponse.OTHER_NATURE_AND_PARK;
            case LAND_BASED_ACTIVITY -> AttractionCategoryResponse.LAND_BASED_ACTIVITY;
            case AIR_BASED_ACTIVITY -> AttractionCategoryResponse.AIR_BASED_ACTIVITY;
            case WATER_BASED_ACTIVITY -> AttractionCategoryResponse.WATER_BASED_ACTIVITY;
            case OTHER_OUTDOOR_ACTIVITY -> AttractionCategoryResponse.OTHER_OUTDOOR_ACTIVITY;
            case SPORTING_EVENT -> AttractionCategoryResponse.SPORTING_EVENT;
            case CULTURAL_EVENT -> AttractionCategoryResponse.CULTURAL_EVENT;
            case THEATRE_EVENT -> AttractionCategoryResponse.THEATRE_EVENT;
            case OTHER_EVENT -> AttractionCategoryResponse.OTHER_EVENT;
            case SHOPPING -> AttractionCategoryResponse.SHOPPING;
            case ZOO_AND_AQUARIUM -> AttractionCategoryResponse.ZOO_AND_AQUARIUM;
            case NIGHTLIFE -> AttractionCategoryResponse.NIGHTLIFE;
            case FOOD -> AttractionCategoryResponse.FOOD;
            case DRINK -> AttractionCategoryResponse.DRINK;
            case WILDLIFE_TOUR -> AttractionCategoryResponse.WILDLIFE_TOUR;
            case EXTREME_SPORT_TOUR -> AttractionCategoryResponse.EXTREME_SPORT_TOUR;
            case OTHER_TOUR -> AttractionCategoryResponse.OTHER_TOUR;
            case WATER_AND_AMUSEMENT_PARK -> AttractionCategoryResponse.WATER_AND_AMUSEMENT_PARK;
            case FILM_AND_TV_TOUR -> AttractionCategoryResponse.FILM_AND_TV_TOUR;
            case CLASS_AND_WORKSHOP -> AttractionCategoryResponse.CLASS_AND_WORKSHOP;
            case OTHER_FUN_AND_GAME -> AttractionCategoryResponse.OTHER_FUN_AND_GAME;
            case SPA_AND_WELLNESS -> AttractionCategoryResponse.SPA_AND_WELLNESS;
            case EATERY -> AttractionCategoryResponse.EATERY;
            case BEVERAGE_SPOT -> AttractionCategoryResponse.BEVERAGE_SPOT;
        };
    }
}