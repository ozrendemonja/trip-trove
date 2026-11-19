import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text
} from "@fluentui/react-components";
import { Checkmark20Regular, Save20Regular } from "@fluentui/react-icons";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect
} from "react";
import {
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
  type BlockerFunction
} from "react-router";
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
  BoardMode,
  PrepareBoardHandle,
  PrepareDraftState
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

export const MyTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const classes = useClasses();
  const [trip, setTrip] = useState<Trip>();
  const [planningBlocked, setPlanningBlocked] = useState(false);
  const boardRef = useRef<PrepareBoardHandle>(null);
  const activeTripId = useRef(tripId);
  const modeChangeGeneration = useRef(0);
  useEffect(() => {
    activeTripId.current = tripId;
    modeChangeGeneration.current++;
    return () => {
      activeTripId.current = undefined;
    };
  }, [tripId]);
  const [prepareDraft, setPrepareDraft] = useState<PrepareDraftState>({
    count: 0,
    saving: false,
    savedCount: 0
  });
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

  const visitHistoryMap = useMemo(
    () => buildVisitHistoryMap(visitHistory),
    [visitHistory]
  );

  const handleUpdate = async (value: SearchTarget) => {
    const targetTripId = tripId;
    const newAttractions = await loadAllAttractionsUnder(
      value.whereToSearch,
      value.id
    );

    let history: AttractionVisitHistory[] = [];
    if (tripId) {
      const newIds = newAttractions.map((a) => a.id);
      history = await fetchAttractionsVisitHistory(Number(tripId), newIds);
    }

    if (activeTripId.current !== targetTripId || !boardRef.current) {
      throw new Error(
        "The trip changed before attractions finished loading. Nothing was added."
      );
    }
    boardRef.current.addAttractions(
      mapServerResponseToTouristDestinations(
        sortAttractions(newAttractions),
        buildVisitHistoryMap(history)
      )
    );
    if (tripId) {
      setVisitHistory((prev) => {
        const map = new Map<number, AttractionVisitHistory>();
        for (const h of prev) map.set(h.attractionId, h);
        for (const h of history) map.set(h.attractionId, h);
        return Array.from(map.values());
      });
    }
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
  const hasPrepareChanges =
    boardMode === "prepare" &&
    (prepareDraft.count > 0 || prepareDraft.saving || planningBlocked);
  const prepareGuard = useRef(hasPrepareChanges);
  useLayoutEffect(() => {
    prepareGuard.current = hasPrepareChanges;
  }, [hasPrepareChanges]);
  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) =>
        prepareGuard.current &&
        currentLocation.pathname !== nextLocation.pathname,
      []
    )
  );
  const resumingNavigation = useRef(false);
  useBeforeUnload(
    useCallback((event: BeforeUnloadEvent) => {
      if (!prepareGuard.current) return;
      event.preventDefault();
      event.returnValue = "";
    }, [])
  );
  useEffect(() => {
    if (blocker.state !== "blocked") {
      resumingNavigation.current = false;
      return;
    }
    if (!hasPrepareChanges && !resumingNavigation.current) {
      resumingNavigation.current = true;
      blocker.proceed();
    }
  }, [blocker, hasPrepareChanges]);

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
              planningBlocked={planningBlocked}
              onModeChange={async (mode) => {
                const generation = ++modeChangeGeneration.current;
                if (
                  boardMode === "prepare" &&
                  mode === "edit" &&
                  (prepareDraft.count > 0 || planningBlocked) &&
                  !(await boardRef.current?.save())
                )
                  return;
                if (
                  generation !== modeChangeGeneration.current ||
                  activeTripId.current !== tripId
                )
                  return;
                setSelectedMode({ tripId, mode });
              }}
              onSavePrepare={() => void boardRef.current?.save()}
              onBack={() => navigate("/my-trips")}
              actions={
                <>
                  {boardMode === "prepare" && (
                    <SearchAttractionsModal
                      text="Trip Planner"
                      onUpdateClick={handleUpdate}
                      planningBlocked={planningBlocked}
                      primary={prepareDraft.count === 0}
                    />
                  )}
                  {boardMode === "prepare" && prepareDraft.count > 0 ? (
                    <Button
                      appearance="primary"
                      icon={<Save20Regular />}
                      disabled={planningBlocked}
                      onClick={() => void boardRef.current?.save()}
                    >
                      {prepareDraft.saving
                        ? "Saving..."
                        : `Save to trip (${prepareDraft.count})`}
                    </Button>
                  ) : prepareDraft.savedCount > 0 ? (
                    <Text role="status">
                      <Checkmark20Regular /> {prepareDraft.savedCount}{" "}
                      {prepareDraft.savedCount === 1 ? "change" : "changes"}{" "}
                      saved
                    </Text>
                  ) : boardMode === "prepare" ? (
                    <Text role="status">
                      <Checkmark20Regular /> All changes saved
                    </Text>
                  ) : null}
                </>
              }
            />
            <Board
              key={tripId}
              ref={boardRef}
              initialCities={savedCities}
              tripId={currentTripId}
              initialReviewData={savedReviewData}
              initialSavedAttractionIds={savedAttractionIds}
              onPlanningBlockedChange={setPlanningBlocked}
              onPrepareDraftChange={setPrepareDraft}
              visitHistory={visitHistoryMap}
              mode={boardMode}
            />
          </>
        ) : (
          <Spinner label="Loading trip" />
        )}
      </main>
      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={(_event, data) => {
          if (
            !data.open &&
            !prepareDraft.saving &&
            blocker.state === "blocked"
          ) {
            blocker.reset();
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Save your Prepare changes?</DialogTitle>
            <DialogContent>
              Your remaining additions, removals and board moves have not been
              saved. Changes already saved will stay in the trip.
              {prepareDraft.unconfirmed && (
                <p>
                  An unconfirmed save may already have reached the trip. Leaving
                  discards the local draft, not a save already committed.
                </p>
              )}
              {prepareDraft.error && (
                <MessageBar intent="error">
                  <MessageBarBody>{prepareDraft.error}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              {prepareDraft.unconfirmed && (
                <Button
                  onClick={() => {
                    if (blocker.state === "blocked") blocker.reset();
                    void boardRef.current?.inspect();
                  }}
                >
                  Inspect saved trip
                </Button>
              )}
              <Button
                appearance="primary"
                disabled={planningBlocked}
                onClick={() => void boardRef.current?.save()}
              >
                {prepareDraft.saving ? "Saving..." : "Save to trip"}
              </Button>
              <Button
                disabled={prepareDraft.saving}
                onClick={() => {
                  boardRef.current?.discard();
                }}
              >
                Leave without saving
              </Button>
              <Button
                disabled={prepareDraft.saving}
                onClick={() => {
                  if (blocker.state === "blocked") blocker.reset();
                }}
              >
                Stay
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
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
