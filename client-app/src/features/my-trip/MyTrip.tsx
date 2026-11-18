import {
  MessageBar,
  MessageBarBody,
  Spinner
} from "@fluentui/react-components";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navigation from "../../shared/navigation/Navigation";
import {
  fetchTripById,
  fetchTripBoard,
  fetchAttractionsVisitHistory
} from "./infra/TripApi";
import type { AttractionVisitHistory } from "./domain/VisitHistory.types";
import Board from "../AI-table/components/Board";
import type {
  TouristDestination,
  Column,
  BoardMode
} from "../AI-table/components/Board.types";
import {
  mapServerResponseToTouristDestinations,
  buildVisitHistoryMap,
  mapSavedTripAttractionsToBoard
} from "../AI-table/utils/Mapper";
import {
  Attraction,
  LastReadAttraction
} from "../continent/domain/Attraction.types";
import type { Rating, Trip } from "./domain/Trip.types";
import { getAttractionById } from "../continent/infra/ManagerApi";
import { createGetPagedAttractions } from "../continent/pages/list-attraction-user/ListAttractionUser.utils";
import { toLastReadAttraction } from "../continent/pages/list-attraction/ListAttraction.util";
import SearchAttractionsModal, { SearchTarget } from "./SearchAttractionsModal";
import { useClasses } from "./MyTrip.styles";
import { TripHeader } from "./TripHeader";

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

export const MyTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const classes = useClasses();
  const [trip, setTrip] = useState<Trip>();
  const [planningBlocked, setPlanningBlocked] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  // The tripId each async source has finished loading for, so the Board's
  // landing mode is never computed from a previous trip's data.
  const [metadataTripId, setMetadataTripId] = useState<number | undefined>(
    undefined
  );
  const [selectedMode, setSelectedMode] = useState<{
    tripId: string | undefined;
    mode: BoardMode;
  }>();

  useEffect(() => {
    if (!tripId) return;
    fetchTripById(Number(tripId))
      .then(setTrip)
      .catch((error: unknown) =>
        setLoadError(
          error instanceof Error
            ? error.message
            : "The trip couldn't be loaded."
        )
      )
      .finally(() => setMetadataTripId(Number(tripId)));
  }, [tripId]);

  // Source of truth: all attractions from server responses
  const [allAttractions, setAllAttractions] = useState<Attraction[]>([]);
  // Cities loaded from saved trip attractions in DB
  const [savedCities, setSavedCities] = useState<TouristDestination[]>([]);
  // Review data (rating + reviewNote + wouldVisitAgain) from DB for pre-populating review mode
  const [savedReviewData, setSavedReviewData] = useState<
    Record<
      number,
      { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
    >
  >({});
  // Attraction IDs already persisted in DB (to avoid duplicate saves)
  const [savedAttractionIds, setSavedAttractionIds] = useState<number[]>([]);
  // The tripId whose saved attractions have finished loading.
  const [attractionsTripId, setAttractionsTripId] = useState<
    number | undefined
  >(undefined);
  // Visit history aggregated across other trips for the loaded attractions
  const [visitHistory, setVisitHistory] = useState<AttractionVisitHistory[]>(
    []
  );

  // Load saved trip attractions from DB on mount
  useEffect(() => {
    if (!tripId) return;
    setLoadError(undefined);
    fetchTripBoard(Number(tripId))
      .then((saved) => {
        const savedIds = saved.map((s) => s.attractionId);
        setSavedAttractionIds(savedIds);

        if (saved.length === 0) {
          // New/empty trip: clear any previous trip's loaded data.
          setSavedCities([]);
          setSavedReviewData({});
          return;
        }

        setSavedCities(mapSavedTripAttractionsToBoard(saved));

        const reviewData: Record<
          number,
          { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
        > = {};
        for (const item of saved) {
          if (item.rating) {
            reviewData[item.attractionId] = {
              rating: item.rating as Rating,
              reviewNote: item.reviewNote ?? "",
              wouldVisitAgain: item.wouldVisitAgain ?? false
            };
          }
        }
        setSavedReviewData(reviewData);

        // Restore visit history for the saved attractions so that the
        // "visited before" badges/details reappear after a page reload.
        fetchAttractionsVisitHistory(Number(tripId), savedIds).then(
          (history) => {
            setVisitHistory((prev) => {
              const map = new Map<number, AttractionVisitHistory>();
              for (const h of prev) map.set(h.attractionId, h);
              for (const h of history) map.set(h.attractionId, h);
              return Array.from(map.values());
            });
          }
        );
      })
      .catch((error: unknown) =>
        setLoadError(
          error instanceof Error
            ? error.message
            : "The trip couldn't be loaded."
        )
      )
      .finally(() => setAttractionsTripId(Number(tripId)));
  }, [tripId]);

  // Derive display attractions from server results and saved trip attractions.
  const visitHistoryMap = useMemo(
    () => buildVisitHistoryMap(visitHistory),
    [visitHistory]
  );

  const attractions = useMemo(() => {
    const fromServer = mapServerResponseToTouristDestinations(
      allAttractions,
      visitHistoryMap
    );
    return mergeCities(savedCities, fromServer);
  }, [allAttractions, savedCities, visitHistoryMap]);

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

    // Fetch visit history for the new attractions (excluding current trip)
    // BEFORE updating state, so that the attractions and their visit history
    // are applied in the same render. Otherwise the board would briefly show
    // (and auto-save) the attractions without visit history, persisting the
    // wrong column group, which then survives a page refresh.
    let history: AttractionVisitHistory[] = [];
    if (tripId) {
      const newIds = newAttractions.map((a) => a.id);
      history = await fetchAttractionsVisitHistory(Number(tripId), newIds);
    }

    setAllAttractions(mergedAttractions);

    if (tripId) {
      setVisitHistory((prev) => {
        const map = new Map<number, AttractionVisitHistory>();
        for (const h of prev) map.set(h.attractionId, h);
        for (const h of history) map.set(h.attractionId, h);
        return Array.from(map.values());
      });
    }
    // attractions will be automatically recomputed via useMemo
  };

  const currentTripId = tripId ? Number(tripId) : undefined;
  const tripDataReady =
    currentTripId !== undefined &&
    metadataTripId === currentTripId &&
    attractionsTripId === currentTripId;
  const initialMode: BoardMode =
    trip?.status === "past" || trip?.status === "archived"
      ? "review"
      : savedAttractionIds.length === 0
        ? "prepare"
        : "edit";
  const boardMode =
    selectedMode?.tripId === tripId && selectedMode
      ? selectedMode.mode
      : initialMode;

  return (
    <>
      <Navigation />
      <main className={classes.workspace}>
        {loadError ? (
          <MessageBar intent="error">
            <MessageBarBody>{loadError}</MessageBarBody>
          </MessageBar>
        ) : tripDataReady ? (
          <>
            <TripHeader
              trip={trip}
              mode={boardMode}
              onModeChange={(mode) => setSelectedMode({ tripId, mode })}
              onBack={() => navigate("/my-trips")}
              actions={
                <SearchAttractionsModal
                  text="Trip Planner"
                  onUpdateClick={handleUpdate}
                  planningBlocked={planningBlocked}
                />
              }
            />
            <Board
              key={tripId}
              initialCities={attractions}
              tripId={currentTripId}
              initialReviewData={savedReviewData}
              initialSavedAttractionIds={savedAttractionIds}
              onPlanningBlockedChange={setPlanningBlocked}
              visitHistory={visitHistoryMap}
              mode={boardMode}
            />
          </>
        ) : (
          <Spinner label="Loading trip" />
        )}
      </main>
    </>
  );
};

const loadAllAttractionsUnder = async (
  whereToSearch: string,
  id: number
): Promise<Attraction[]> => {
  if (whereToSearch.toLocaleLowerCase() === "attraction") {
    return [await getAttractionById(id)];
  }

  let result: Attraction[] = [];
  let lastElement: LastReadAttraction | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    // TODO Change whereToSearch to enum so not toLocaleLowerCase is needed
    const attractions = await createGetPagedAttractions(
      whereToSearch.toLocaleLowerCase()
    )(id, lastElement);

    hasMore = attractions.length > 0;
    if (!hasMore) {
      break;
    }
    lastElement = toLastReadAttraction(attractions);

    result = [...result, ...attractions];
  }

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
