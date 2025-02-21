import { SaveAttractionRequest } from "../../../clients/manager";

type AttractionName = {
  name: string;
  mainAttractionName?: string;
};

type AttractionDestination = {
  cityName?: string;
  regionName: string;
  countryName: string;
  isCountrywide: boolean;
};

type AttractionLocation = {
  latitude: number;
  longitude: number;
};

export type AttractionAddress = {
  streetAddress?: string;
  location?: AttractionLocation;
};

export type AttractionInfoFrom = {
  source: string;
  recorded: string;
};

export type AttractionOptimalVisitPeriod = {
  fromDate: string;
  toDate: string;
};

export enum CategoryType {
  "POINT_OF_INTEREST_AND_LANDMARK",
  "HISTORIC_SITE",
  "RELIGIOUS_SITE",
  "ARENA_AND_STADIUM",
  "OTHER_LANDMARK",
  "SPECIALITY_MUSEUM",
  "ART_MUSEUM",
  "HISTORY_MUSEUM",
  "SCIENCE_MUSEUM",
  "OTHER_MUSEUM",
  "PARK",
  "NATURE_AND_WILDLIFE_AREA",
  "OTHER_NATURE_AND_PARK",
  "LAND_BASED_ACTIVITY",
  "AIR_BASED_ACTIVITY",
  "WATER_BASED_ACTIVITY",
  "OTHER_OUTDOOR_ACTIVITY",
  "SPORTING_EVENT",
  "CULTURAL_EVENT",
  "THEATRE_EVENT",
  "OTHER_EVENT",
  "SHOPPING",
  "ZOO_AND_AQUARIUM",
  "NIGHTLIFE",
  "FOOD",
  "DRINK",
  "WILDLIFE_TOUR",
  "EXTREME_SPORT_TOUR",
  "OTHER_TOUR",
  "WATER_AND_AMUSEMENT_PARK",
  "FILM_AND_TV_TOUR",
  "CLASS_AND_WORKSHOP",
  "OTHER_FUN_AND_GAME",
  "SPA_AND_WELLNESS",
  "EATERY",
  "BEVERAGE_SPOT"
}

export enum AttractionType {
  "IMMINENT_CHANGE",
  "POTENTIAL_CHANGE",
  "STABLE"
}

export type Attraction = {
  id: number;
  name: AttractionName;
  destination: AttractionDestination;
  address: AttractionAddress;
  category: CategoryType;
  type: AttractionType;
  mustVisit: boolean;
  isTraditional: boolean;
  tip?: string;
  infoFrom: AttractionInfoFrom;
  optimalVisitPeriod?: AttractionOptimalVisitPeriod;
  updatedOn: string;
};

// Repeated
export type LastReadAttraction = {
  id: number;
  updatedOn: string;
};

export type SaveAttraction = {
  isCountrywide: boolean;
  regionId?: number;
  cityId?: number;
  attractionName: string;
  mainAttractionId?: number;
  attractionAddress?: string;
  attractionLocation?: AttractionLocation;
  attractionCategory: CategoryType;
  attractionType: AttractionType;
  mustVisit: boolean;
  isTraditional: boolean;
  tip?: string;
  infoFrom: string;
  infoRecorded: string;
  optimalVisitPeriod?: AttractionOptimalVisitPeriod;
};

export const mapCategory: {
  [key in CategoryType]: SaveAttractionRequest["attractionCategory"];
} = {
  [CategoryType.POINT_OF_INTEREST_AND_LANDMARK]:
    "POINT_OF_INTEREST_AND_LANDMARK",
  [CategoryType.HISTORIC_SITE]: "HISTORIC_SITE",
  [CategoryType.RELIGIOUS_SITE]: "RELIGIOUS_SITE",
  [CategoryType.ARENA_AND_STADIUM]: "ARENA_AND_STADIUM",
  [CategoryType.OTHER_LANDMARK]: "OTHER_LANDMARK",
  [CategoryType.SPECIALITY_MUSEUM]: "SPECIALITY_MUSEUM",
  [CategoryType.ART_MUSEUM]: "ART_MUSEUM",
  [CategoryType.HISTORY_MUSEUM]: "HISTORY_MUSEUM",
  [CategoryType.SCIENCE_MUSEUM]: "SCIENCE_MUSEUM",
  [CategoryType.OTHER_MUSEUM]: "OTHER_MUSEUM",
  [CategoryType.PARK]: "PARK",
  [CategoryType.NATURE_AND_WILDLIFE_AREA]: "NATURE_AND_WILDLIFE_AREA",
  [CategoryType.OTHER_NATURE_AND_PARK]: "OTHER_NATURE_AND_PARK",
  [CategoryType.LAND_BASED_ACTIVITY]: "LAND_BASED_ACTIVITY",
  [CategoryType.AIR_BASED_ACTIVITY]: "AIR_BASED_ACTIVITY",
  [CategoryType.WATER_BASED_ACTIVITY]: "WATER_BASED_ACTIVITY",
  [CategoryType.OTHER_OUTDOOR_ACTIVITY]: "OTHER_OUTDOOR_ACTIVITY",
  [CategoryType.SPORTING_EVENT]: "SPORTING_EVENT",
  [CategoryType.CULTURAL_EVENT]: "CULTURAL_EVENT",
  [CategoryType.THEATRE_EVENT]: "THEATRE_EVENT",
  [CategoryType.OTHER_EVENT]: "OTHER_EVENT",
  [CategoryType.SHOPPING]: "SHOPPING",
  [CategoryType.ZOO_AND_AQUARIUM]: "ZOO_AND_AQUARIUM",
  [CategoryType.NIGHTLIFE]: "NIGHTLIFE",
  [CategoryType.FOOD]: "FOOD",
  [CategoryType.DRINK]: "DRINK",
  [CategoryType.WILDLIFE_TOUR]: "WILDLIFE_TOUR",
  [CategoryType.EXTREME_SPORT_TOUR]: "EXTREME_SPORT_TOUR",
  [CategoryType.OTHER_TOUR]: "OTHER_TOUR",
  [CategoryType.WATER_AND_AMUSEMENT_PARK]: "WATER_AND_AMUSEMENT_PARK",
  [CategoryType.FILM_AND_TV_TOUR]: "FILM_AND_TV_TOUR",
  [CategoryType.CLASS_AND_WORKSHOP]: "CLASS_AND_WORKSHOP",
  [CategoryType.OTHER_FUN_AND_GAME]: "OTHER_FUN_AND_GAME",
  [CategoryType.SPA_AND_WELLNESS]: "SPA_AND_WELLNESS",
  [CategoryType.EATERY]: "EATERY",
  [CategoryType.BEVERAGE_SPOT]: "BEVERAGE_SPOT"
};

export const mapType: {
  [key in AttractionType]: SaveAttractionRequest["attractionType"];
} = {
  [AttractionType.IMMINENT_CHANGE]: "IMMINENT_CHANGE",
  [AttractionType.POTENTIAL_CHANGE]: "POTENTIAL_CHANGE",
  [AttractionType.STABLE]: "STABLE"
};
