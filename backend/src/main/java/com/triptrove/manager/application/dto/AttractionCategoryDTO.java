package com.triptrove.manager.application.dto;

import lombok.Getter;

@Getter
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
    EATERY, BEVERAGE_SPOT
}