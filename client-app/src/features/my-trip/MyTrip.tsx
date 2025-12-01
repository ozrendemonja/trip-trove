import { Stack, Text } from "@fluentui/react";
import React, { useState } from "react";
import Navigation from "../../shared/navigation/Navigation";
import Board, { TouristDestination } from "../AI-table/components/Board";
import { mapServerResponseToTouristDestinations } from "../AI-table/utils/mapper";
import {
  Attraction,
  LastReadAttraction
} from "../continent/domain/Attraction.types";
import { createGetPagedAttractions } from "../continent/pages/list-attraction-user/ListAttractionUser.utils";
import SearchAttractionsModal, { SearchTarget } from "./SearchAttractionsModal";

export const MyTrip: React.FunctionComponent = () => {
  const [attractions, setAttractions] = useState<TouristDestination[]>([]);
  const [allAttractions, setAllAttractions] = useState<Attraction[]>([]);
  const handleUpdate = async (value: SearchTarget) => {
    const newAttractions = await loadAllAttractionsUnder(
      value.whereToSearch,
      value.id
    );

    // Merge and remove duplicates by id
    let mergedAttractions = Array.from(
      new Map(
        [...allAttractions, ...newAttractions].map((item) => [item.id, item])
      ).values()
    );

    // sort it to be in order
    mergedAttractions = sortAttractions(mergedAttractions);
    setAllAttractions(mergedAttractions);

    // transform to the TouristDestination
    const result = mapServerResponseToTouristDestinations(mergedAttractions);
    setAttractions(result);
  };

  return (
    <>
      <Navigation />
      <Stack horizontal>
        <Text
          as="h1"
          styles={{ root: { fontSize: 30, paddingLeft: 10, paddingRight: 10 } }}
        >
          Trip Planner
        </Text>
        <SearchAttractionsModal
          text="Trip Planner"
          onUpdateClick={handleUpdate}
        />
      </Stack>
      <Board initialCities={attractions} />
    </>
  );
};

const loadAllAttractionsUnder = async (
  whereToSearch: string,
  id: number
): Promise<Attraction[]> => {
  let result: Attraction[] = [];
  let lastElement: LastReadAttraction | undefined = undefined;

  do {
    // TODO Change whereToSearch to enum so not toLocaleLowerCase is needed
    var attractions = await createGetPagedAttractions(
      whereToSearch.toLocaleLowerCase()
    )(id, lastElement);

    if (attractions.length <= 0) {
      break;
    }
    lastElement = {
      id: attractions[attractions.length - 1].id,
      updatedOn: attractions[attractions.length - 1].updatedOn
    };

    result = [...result, ...attractions];
  } while (true);

  return result;
};

function sortAttractions(attractions: Attraction[]): Attraction[] {
  // Use a copy to keep original array intact
  return [...attractions].sort((a, b) => {
    const da = a.destination;
    const db = b.destination;

    // 1) Country
    const countryCmp = localeCmp(da.countryName, db.countryName);
    if (countryCmp !== 0) return countryCmp;

    // 2) Region
    const regionCmp = localeCmp(da.regionName, db.regionName);
    if (regionCmp !== 0) return regionCmp;

    // 3) Within same region: cities first, then region-level items
    const aHasCity = !!da.cityName;
    const bHasCity = !!db.cityName;
    if (aHasCity !== bHasCity) return aHasCity ? -1 : 1;

    // 4) Sort by cityName (with fallback to regionName for non-city items)
    const aCityOrRegion = da.cityName ?? da.regionName;
    const bCityOrRegion = db.cityName ?? db.regionName;

    const cityCmp = localeCmp(aCityOrRegion, bCityOrRegion);
    if (cityCmp !== 0) return cityCmp;

    // Optional tie-breakers for deterministic order:
    const nameCmp = localeCmp(String(a.name), String(b.name));
    if (nameCmp !== 0) return nameCmp;

    return a.id - b.id;
  });
}

// Small helper for consistent, locale-aware string comparison.
// Adjust locale and options if you want case-insensitive or numeric-aware sorting.
function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true
  });
}

export default MyTrip;
