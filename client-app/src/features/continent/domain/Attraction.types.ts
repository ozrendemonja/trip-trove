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

type AttractionAddress = {
  streetAddress?: string;
  location?: AttractionLocation;
};

type AttractionInfoFrom = {
  source: string;
  recorded: string;
};

type AttractionOptimalVisitPeriod {
        fromDate?: string;
        toDate?: string;
}

export type Attraction = {
  id: number;
  name: AttractionName;
  destination: AttractionDestination;
  address: AttractionAddress;
  category:
    | "POINT_OF_INTEREST_AND_LANDMARK"
    | "HISTORIC_SITE"
    | "RELIGIOUS_SITE"
    | "ARENA_AND_STADIUM"
    | "OTHER_LANDMARK"
    | "SPECIALITY_MUSEUM"
    | "ART_MUSEUM"
    | "HISTORY_MUSEUM"
    | "SCIENCE_MUSEUM"
    | "OTHER_MUSEUM"
    | "PARK"
    | "NATURE_AND_WILDLIFE_AREA"
    | "OTHER_NATURE_AND_PARK"
    | "LAND_BASED_ACTIVITY"
    | "AIR_BASED_ACTIVITY"
    | "WATER_BASED_ACTIVITY"
    | "OTHER_OUTDOOR_ACTIVITY"
    | "SPORTING_EVENT"
    | "CULTURAL_EVENT"
    | "THEATRE_EVENT"
    | "OTHER_EVENT"
    | "SHOPPING"
    | "ZOO_AND_AQUARIUM"
    | "NIGHTLIFE"
    | "FOOD"
    | "DRINK"
    | "WILDLIFE_TOUR"
    | "EXTREME_SPORT_TOUR"
    | "OTHER_TOUR"
    | "WATER_AND_AMUSEMENT_PARK"
    | "FILM_AND_TV_TOUR"
    | "CLASS_AND_WORKSHOP"
    | "OTHER_FUN_AND_GAME"
    | "SPA_AND_WELLNESS"
    | "EATERY"
    | "BEVERAGE_SPOT";
  type: "IMMINENT_CHANGE" | "POTENTIAL_CHANGE" | "STABLE";
  mustVisit: boolean;
  isTraditional: boolean;
  tip?: string;
  infoFrom: AttractionInfoFrom;
  optimalVisitPeriod: AttractionOptimalVisitPeriod; 
  updatedOn: string;
};

// Repeated
export type LastReadAttraction = {
  id: number;
  updatedOn: string;
};
