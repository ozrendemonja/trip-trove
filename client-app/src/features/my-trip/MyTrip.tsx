import { ActionButton, Stack, Text } from "@fluentui/react";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navigation from "../../shared/navigation/Navigation";
import { fetchTripById, fetchTripAttractions } from "./infra/TripApi";
import type { TripAttractionFromServer } from "./infra/TripApi";
import Board from "../AI-table/components/Board";
import type {
  TouristDestination,
  Column
} from "../AI-table/components/Board.types";
import type { Attraction as BoardAttraction } from "../AI-table/components/AttractionList.types";
import { mapServerResponseToTouristDestinations } from "../AI-table/utils/mapper";
import {
  Attraction,
  LastReadAttraction
} from "../continent/domain/Attraction.types";
import { createGetPagedAttractions } from "../continent/pages/list-attraction-user/ListAttractionUser.utils";
import SearchAttractionsModal, { SearchTarget } from "./SearchAttractionsModal";
import { useClasses } from "./MyTrip.styles";

// Helper function to merge cities by name and combine their attractions
function mergeCities(
  baseCities: TouristDestination[],
  newCities: TouristDestination[]
): TouristDestination[] {
  const cityMap = new Map<string, TouristDestination>();

  // Collect all existing attraction IDs from baseCities (across all columns)
  const existingAttractionIds = new Set<number>();
  for (const city of baseCities) {
    for (const col of city.columns) {
      for (const task of col.tasks) {
        existingAttractionIds.add(task.id);
      }
    }
  }

  // Add base cities first
  for (const city of baseCities) {
    cityMap.set(city.name, {
      ...city,
      columns: city.columns.map((col: Column) => ({
        ...col,
        tasks: [...col.tasks]
      }))
    });
  }

  // Merge new cities, but skip attractions that already exist anywhere in baseCities
  for (const newCity of newCities) {
    const existingCity = cityMap.get(newCity.name);
    if (existingCity) {
      // Merge columns by matching column titles
      for (const newCol of newCity.columns) {
        const existingCol = existingCity.columns.find(
          (c: Column) => c.title === newCol.title
        );
        if (existingCol) {
          // Merge tasks, avoiding duplicates by id (check against ALL existing attractions)
          for (const task of newCol.tasks) {
            if (!existingAttractionIds.has(task.id)) {
              existingCol.tasks.push(task);
              existingAttractionIds.add(task.id); // Mark as added
            }
          }
        } else {
          // Add new column, but only with non-duplicate tasks
          const filteredTasks = newCol.tasks.filter(
            (task: { id: number }) => !existingAttractionIds.has(task.id)
          );
          if (filteredTasks.length > 0) {
            existingCity.columns.push({ ...newCol, tasks: filteredTasks });
            filteredTasks.forEach((task: { id: number }) =>
              existingAttractionIds.add(task.id)
            );
          }
        }
      }
    } else {
      // Add new city, but filter out any attractions that exist in other cities
      const filteredColumns = newCity.columns.map((col: Column) => ({
        ...col,
        tasks: col.tasks.filter(
          (task: { id: number }) => !existingAttractionIds.has(task.id)
        )
      }));
      // Mark these as added
      for (const col of filteredColumns) {
        for (const task of col.tasks) {
          existingAttractionIds.add(task.id);
        }
      }
      cityMap.set(newCity.name, {
        ...newCity,
        columns: filteredColumns
      });
    }
  }

  return Array.from(cityMap.values());
}

// Convert saved trip attractions from the DB into TouristDestination[] using attraction group
const GROUP_TO_COLUMN: Record<string, string> = {
  PRIMARY: "Top Attractions",
  SECONDARY: "Secondary Spots",
  EXCLUDED: "Excluded Attractions"
};

function mapSavedTripAttractionsToBoard(
  items: TripAttractionFromServer[]
): TouristDestination[] {
  // Group by city/region, then by column title
  const cityColumnMap = new Map<string, Map<string, BoardAttraction[]>>();

  for (const item of items) {
    const cityOrRegion =
      item.cityName?.trim() || item.regionName.trim();
    const cityKey = cityOrRegion || item.countryName;
    const columnTitle = item.attractionGroup
      ? (GROUP_TO_COLUMN[item.attractionGroup] || "Secondary Spots")
      : (item.mustVisit ? "Top Attractions" : "Secondary Spots");

    if (!cityColumnMap.has(cityKey)) {
      cityColumnMap.set(cityKey, new Map());
    }
    const colMap = cityColumnMap.get(cityKey)!;
    if (!colMap.has(columnTitle)) {
      colMap.set(columnTitle, []);
    }

    const typeStr = item.attractionType || "";
    const stable = typeStr === "STABLE";

    colMap.get(columnTitle)!.push({
      id: item.attractionId,
      mustVisit: item.mustVisit,
      stable,
      isTraditional: item.isTraditional,
      isCountrywide: item.isCountrywide,
      name: item.attractionName,
      address: item.attractionAddress || "",
      category: item.attractionCategory || "",
      infoFrom: (item.infoFrom || "") + " " + (item.infoRecorded || ""),
      note: item.tip || "",
      optimalVisitPeriod: item.optimalVisitPeriod
        ? `${item.optimalVisitPeriod.fromDate} - ${item.optimalVisitPeriod.toDate}`
        : undefined,
      workingHours: undefined,
      VisitTime: ""
    });
  }

  const cities: TouristDestination[] = [];
  for (const [cityName, colMap] of Array.from(cityColumnMap.entries())) {
    const baseId = cityName.toLowerCase().replace(/\s+/g, "_");
    // Ensure standard columns exist
    const columnOrder = Object.values(GROUP_TO_COLUMN);
    const columns: { id: string; title: string; tasks: BoardAttraction[] }[] = [];

    for (const title of columnOrder) {
      const colId = `${baseId}_${title.toLowerCase().replace(/\s+/g, "_")}`;
      columns.push({
        id: colId,
        title,
        tasks: colMap.get(title) || []
      });
    }
    // Add any non-standard columns
    for (const [title, tasks] of colMap.entries()) {
      if (!columnOrder.includes(title)) {
        const colId = `${baseId}_${title.toLowerCase().replace(/\s+/g, "_")}`;
        columns.push({ id: colId, title, tasks });
      }
    }

    cities.push({ name: cityName, columns });
  }

  return cities;
}

export const MyTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const classes = useClasses();
  const [tripName, setTripName] = useState("Trip Planner");

  useEffect(() => {
    if (!tripId) return;
    fetchTripById(Number(tripId)).then((trip) => {
      if (trip) setTripName(trip.name);
    });
  }, [tripId]);

  // Source of truth: all attractions from server responses
  const [allAttractions, setAllAttractions] = useState<Attraction[]>([]);
  // Loaded cities from JSON file (already in display format, preserved separately)
  const [loadedCities, setLoadedCities] = useState<TouristDestination[]>([]);
  // Cities loaded from saved trip attractions in DB
  const [savedCities, setSavedCities] = useState<TouristDestination[]>([]);

  // Load saved trip attractions from DB on mount
  useEffect(() => {
    if (!tripId) return;
    fetchTripAttractions(Number(tripId)).then((saved) => {
      if (saved.length > 0) {
        setSavedCities(mapSavedTripAttractionsToBoard(saved));
      }
    });
  }, [tripId]);

  // Derive display attractions from allAttractions, then merge with loadedCities and savedCities
  const attractions = useMemo(() => {
    const fromServer = mapServerResponseToTouristDestinations(allAttractions);
    const merged = mergeCities(savedCities, fromServer);
    return mergeCities(merged, loadedCities);
  }, [allAttractions, loadedCities, savedCities]);

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
    // attractions will be automatically recomputed via useMemo
  };

  // Callback when cities are loaded from JSON file in Board
  const handleCitiesLoaded = (cities: TouristDestination[]) => {
    setLoadedCities(cities);
    // attractions will be automatically recomputed via useMemo
  };

  return (
    <>
      <Navigation />
      <Stack horizontal verticalAlign="center">
        <ActionButton
          iconProps={{ iconName: "Back" }}
          onClick={() => navigate("/my-trips")}
          className={classes.backButton}
        >
          My Trips
        </ActionButton>
        <Text as="h1" className={classes.tripName}>
          {tripName}
        </Text>
        <SearchAttractionsModal
          text="Trip Planner"
          onUpdateClick={handleUpdate}
        />
      </Stack>
      <Board
        initialCities={attractions}
        onCitiesLoaded={handleCitiesLoaded}
        tripId={tripId ? Number(tripId) : undefined}
      />
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
