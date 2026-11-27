import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Link,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  mergeClasses
} from "@fluentui/react-components";
import { Checkmark20Regular, Save20Regular } from "@fluentui/react-icons";
import React, {
  useState,
  useMemo,
  useEffect,
  useEffectEvent,
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
  fetchAttractionsVisitHistory,
  isTripPast
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
import {
  ItineraryContent,
  ItineraryDayPager,
  ItineraryRefreshNotice,
  useItinerary,
  type ItineraryTarget
} from "./Itinerary";
import { entryTargetId } from "./TimelineEntry";
import { ItineraryCheckControls } from "./ItineraryCheckControls";
import { useItineraryCheck } from "./useItineraryCheck";
import type { PlanningFeedback } from "./useTripPlanningSave";
import {
  TripPlanningWorkspace,
  useTripPlanningWorkspace
} from "./useTripPlanningWorkspace";

type StepTarget = ItineraryTarget | { attractionId: number };

const unavailableCheckReason = (
  itinerary: ReturnType<typeof useItinerary>,
  check: ReturnType<typeof useItineraryCheck>,
  planningBlocked: boolean
): string | undefined => {
  const { draft } = itinerary.scheduling;
  if (check.unconfirmed)
    return "Inspect the saved check state before confirming again.";
  if (check.requiresRefresh)
    return "Refresh the itinerary before confirming again.";
  if (check.activity) return "Wait for the check to finish saving.";
  if (draft?.unconfirmed)
    return "Inspect the saved itinerary to resolve the unconfirmed addition.";
  if (draft?.activity) return "Wait for the attraction save to finish.";
  if (draft) return "Finish or cancel adding the attraction first.";
  if (itinerary.timingEditing.pending?.recovery)
    return "Inspect the saved timing before checking the itinerary.";
  if (itinerary.timingEditing.pending)
    return "Wait for the timing edit to finish.";
  if (itinerary.dayNotes.draft?.recovery)
    return "Inspect the saved note before checking the itinerary.";
  if (itinerary.dayNotes.draft)
    return "Finish or cancel editing the note before checking the itinerary.";
  if (planningBlocked)
    return "Finish or resolve the pending planning change first.";
  if (itinerary.loading) return "Wait for the saved itinerary to load.";
  if (itinerary.failed)
    return itinerary.saved
      ? "Refresh the itinerary before checking it."
      : "Retry loading the itinerary before checking it.";
  if (itinerary.newer)
    return "Refresh the itinerary to review the newer data before checking it.";
  return undefined;
};

export const MyTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  return <TripWorkspace key={tripId} tripId={tripId} />;
};

const TripWorkspace = ({ tripId }: { tripId?: string }): React.ReactElement => {
  const navigate = useNavigate();
  const classes = useClasses();
  const planningGuard = useRef(false);
  const { workspace, hasDrafts } = useTripPlanningWorkspace(planningGuard);
  const [trip, setTrip] = useState<Trip & { hasItineraryContent: boolean }>();
  const [boardSave, setBoardSave] = useState<PlanningFeedback>();
  const planningBlocked =
    boardSave?.state === "saving" ||
    (boardSave?.state === "error" &&
      (!!boardSave.unconfirmed ||
        !boardSave.proposal.allowRetryAfterRejection));
  const [boardPlaceOrder, setBoardPlaceOrder] = useState<string[]>([]);
  const boardRef = useRef<PrepareBoardHandle>(null);
  const addAttractionsButton = useRef<HTMLButtonElement>(null);
  const focusPrepareAction = useRef(false);
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
    attractionId?: number;
  }>();
  const [requestedMode, setRequestedMode] = useState<
    NonNullable<typeof selectedMode> & { target?: StepTarget }
  >();

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
    trip?.hasItineraryContent && !isTripPast(trip.endDate)
      ? "itinerary"
      : trip?.status === "past" || trip?.status === "archived"
        ? "review"
        : savedAttractionIds.length === 0
          ? "prepare"
          : "edit";
  const boardMode =
    selectedMode?.tripId === tripId && selectedMode
      ? selectedMode.mode
      : initialMode;
  useLayoutEffect(() => {
    if (boardMode !== "prepare" || !focusPrepareAction.current) return;
    focusPrepareAction.current = false;
    addAttractionsButton.current?.focus();
  }, [boardMode]);
  const itineraryOpen =
    tripDataReady && !loadError && boardMode === "itinerary";
  const planOpen = tripDataReady && !loadError && boardMode === "readOnly";
  const stepAttractionId =
    selectedMode?.tripId === tripId ? selectedMode?.attractionId : undefined;
  const itinerary = useItinerary(
    tripDataReady && !loadError ? currentTripId : undefined,
    itineraryOpen,
    workspace,
    (attractionId, duration) =>
      boardRef.current?.reflectSavedVisitDuration(attractionId, duration),
    itineraryOpen ? stepAttractionId : undefined
  );
  const entryDraft = itinerary.scheduling.draft;
  const pendingTimingEdit = itinerary.timingEditing.pending;
  const noteDraft = itinerary.dayNotes.draft;
  const { refresh: refreshItinerary, checkForUpdates } = itinerary;
  const check = useItineraryCheck(
    currentTripId,
    itinerary.saved?.checkContext,
    refreshItinerary,
    workspace
  );
  const reloadSavedItinerary = useCallback(async (): Promise<void> => {
    if (!(await refreshItinerary())) {
      throw new Error("The itinerary couldn't be refreshed.");
    }
  }, [refreshItinerary]);
  const refreshAfterBoardRemoval = useCallback(() => {
    void refreshItinerary();
  }, [refreshItinerary]);
  const headerTrip = trip && {
    ...trip,
    startDate: itinerary.days[0]?.date ?? trip.startDate,
    endDate: itinerary.days.at(-1)?.date ?? trip.endDate
  };
  const checkUnavailableReason = unavailableCheckReason(
    itinerary,
    check,
    planningBlocked
  );
  const refreshWhenVisible = useEffectEvent((): void => {
    if (
      document.visibilityState !== "visible" ||
      saving ||
      !tripDataReady ||
      loadError
    )
      return;
    if (itineraryOpen) {
      void checkForUpdates();
    } else {
      void boardRef.current?.refresh();
    }
  });
  useEffect(() => {
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () =>
      document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, []);

  const saving =
    boardSave?.state === "saving" ||
    !!boardSave?.refreshing ||
    !!entryDraft?.activity ||
    !!check.activity ||
    !!pendingTimingEdit?.activity ||
    !!noteDraft?.activity;
  const unconfirmed =
    !!boardSave?.unconfirmed ||
    !!entryDraft?.unconfirmed ||
    check.unconfirmed ||
    pendingTimingEdit?.recovery === "unconfirmed" ||
    noteDraft?.recovery === "unconfirmed";
  const hasPrepareChanges =
    boardMode === "prepare" && (prepareDraft.count > 0 || !!prepareDraft.error);
  const hasPlanningChanges =
    saving ||
    unconfirmed ||
    hasPrepareChanges ||
    hasDrafts ||
    check.rejected ||
    itinerary.timingEditing.rejections.length > 0 ||
    itinerary.timingEditing.hasClockInputs ||
    boardSave?.state === "error" ||
    !!entryDraft ||
    !!noteDraft;
  useLayoutEffect(() => {
    planningGuard.current = hasPlanningChanges;
  }, [hasPlanningChanges]);
  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) =>
        workspace.hasLocalWork() &&
        currentLocation.pathname !== nextLocation.pathname,
      [workspace]
    )
  );
  const leavingTrip = blocker.state === "blocked";
  const nextMode = requestedMode?.tripId === tripId ? requestedMode : undefined;
  const waitingToLeave = leavingTrip || !!nextMode;
  const resumingNavigation = useRef(false);
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (!workspace.hasLocalWork()) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [workspace]
    )
  );
  useEffect(() => {
    if (blocker.state !== "blocked") {
      resumingNavigation.current = false;
      return;
    }
    if (!workspace.hasLocalWork() && !resumingNavigation.current) {
      resumingNavigation.current = true;
      blocker.proceed();
    }
  }, [blocker, hasPlanningChanges, workspace]);
  const focusRequestedTarget = useEffectEvent((target: ItineraryTarget): void =>
    itinerary.focusItineraryTarget(target)
  );
  useEffect(() => {
    if (
      !nextMode ||
      leavingTrip ||
      hasPlanningChanges ||
      workspace.hasLocalWork()
    )
      return;
    const { tripId, mode, target } = nextMode;
    if (target && "date" in target) focusRequestedTarget(target);
    setSelectedMode({
      tripId,
      mode,
      attractionId:
        target && "attractionId" in target ? target.attractionId : undefined
    });
    setRequestedMode(undefined);
  }, [nextMode, leavingTrip, hasPlanningChanges, workspace]);

  const changeMode = async (
    mode: BoardMode,
    target?: StepTarget
  ): Promise<void> => {
    if (mode === boardMode) {
      if (target && "date" in target) itinerary.focusItineraryTarget(target);
      return;
    }
    const request = { tripId, mode, target };
    const generation = ++modeChangeGeneration.current;
    if (
      boardMode === "prepare" &&
      mode === "edit" &&
      hasPrepareChanges &&
      !unconfirmed
    ) {
      if (
        (await boardRef.current?.save()) &&
        generation === modeChangeGeneration.current &&
        activeTripId.current === tripId
      ) {
        setRequestedMode(request);
      }
      return;
    }
    if (workspace.hasLocalWork() || target) {
      setRequestedMode(request);
    } else {
      setSelectedMode({ tripId, mode });
    }
  };

  const renderScheduledStatus = (attractionId: number): React.ReactNode => {
    const target = itinerary.scheduledEntries.get(attractionId);
    if (!target) return null;
    return (
      <Link
        inline
        href={`#${entryTargetId(target.entryId)}`}
        onClick={(event) => {
          event.preventDefault();
          void changeMode("itinerary", target);
        }}
      >
        {`Scheduled \u00b7 Day ${target.dayNumber}`}
      </Link>
    );
  };

  const stay = (): void => {
    focusPrepareAction.current = false;
    setRequestedMode(undefined);
    if (blocker.state === "blocked") blocker.reset();
  };

  const discard = (): void => {
    if (saving || unconfirmed) return;
    workspace.discardDrafts();
    check.discardRejection();
    itinerary.timingEditing.discardDrafts();
    if (entryDraft) itinerary.scheduling.cancel();
    itinerary.dayNotes.cancel();
    if (boardSave?.state === "error" || hasPrepareChanges) {
      boardRef.current?.discard();
    }
  };

  return (
    <TripPlanningWorkspace value={workspace}>
      <Navigation className={classes.tripNavigation} />
      <main
        className={mergeClasses(
          classes.workspace,
          itineraryOpen && classes.itineraryWorkspace
        )}
      >
        {loadError ? (
          <MessageBar intent="error">
            <MessageBarBody>{loadError}</MessageBarBody>
          </MessageBar>
        ) : tripDataReady ? (
          <>
            <TripHeader
              trip={headerTrip}
              mode={boardMode}
              onModeChange={changeMode}
              onSavePrepare={() => void boardRef.current?.save()}
              onBack={() => navigate("/my-trips")}
              check={
                <ItineraryCheckControls
                  key={tripId}
                  saved={itinerary.saved}
                  failed={itinerary.failed}
                  loading={itinerary.loading}
                  showAction={itineraryOpen}
                  unavailableReason={checkUnavailableReason}
                  jumpBlocked={hasPlanningChanges || planningBlocked}
                  check={check}
                  onJump={(target) => void changeMode("itinerary", target)}
                  onRetry={() => void checkForUpdates()}
                />
              }
              actions={
                <>
                  {boardMode === "edit" && stepAttractionId !== undefined && (
                    <Button
                      onClick={() =>
                        void changeMode("itinerary", {
                          attractionId: stepAttractionId
                        })
                      }
                    >
                      Return to itinerary
                    </Button>
                  )}
                  {itineraryOpen && (
                    <ItineraryDayPager
                      itinerary={itinerary}
                      refreshBlocked={saving}
                    />
                  )}
                  {boardMode === "prepare" && (
                    <SearchAttractionsModal
                      text="Trip Planner"
                      triggerRef={addAttractionsButton}
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
            {planOpen &&
              (itinerary.failed && !itinerary.saved ? (
                <MessageBar intent="error">
                  <MessageBarBody>
                    The itinerary couldn&apos;t be loaded. Scheduled status is
                    unavailable.
                  </MessageBarBody>
                </MessageBar>
              ) : (
                <ItineraryRefreshNotice
                  failed={itinerary.failed}
                  newer={itinerary.newer}
                  staleMessage="Scheduled status may be out of date."
                />
              ))}
            <Board
              key={tripId}
              ref={boardRef}
              initialCities={savedCities}
              tripId={currentTripId}
              initialReviewData={savedReviewData}
              initialSavedAttractionIds={savedAttractionIds}
              onPlanningChange={setBoardSave}
              onReloadSavedPlanning={reloadSavedItinerary}
              onRefreshScheduledStatus={planOpen ? checkForUpdates : undefined}
              onItineraryEntriesRemoved={refreshAfterBoardRemoval}
              onPlaceOrderChange={setBoardPlaceOrder}
              onPrepareDraftChange={setPrepareDraft}
              renderScheduledStatus={
                planOpen ? renderScheduledStatus : undefined
              }
              visitHistory={visitHistoryMap}
              mode={boardMode}
              revealedAttractionId={
                boardMode === "edit" ? stepAttractionId : undefined
              }
            />
            {itineraryOpen && (
              <ItineraryContent
                itinerary={itinerary}
                boardPlaceOrder={boardPlaceOrder}
                prepareBlocked={planningBlocked || check.locked}
                onEditTripData={(attractionId) =>
                  void changeMode("edit", { attractionId })
                }
                onPrepare={() => {
                  if (planningBlocked || check.locked || pendingTimingEdit)
                    return;
                  focusPrepareAction.current = true;
                  void changeMode("prepare");
                }}
              />
            )}
          </>
        ) : (
          <Spinner label="Loading trip" />
        )}
      </main>
      <Dialog
        open={
          waitingToLeave &&
          (hasPrepareChanges || (!saving && hasPlanningChanges))
        }
        onOpenChange={(_event, data) => {
          if (!data.open && !saving) stay();
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {hasPrepareChanges
                ? "Save your Prepare changes?"
                : "Leave the current planning change?"}
            </DialogTitle>
            <DialogContent>
              {unconfirmed
                ? "This save may have reached the trip. Stay to inspect saved planning before leaving."
                : hasPrepareChanges
                  ? "Your remaining additions, removals and board moves have not been saved. Changes already saved will stay in the trip."
                  : "This change has not been saved. Stay to keep your input."}
              {prepareDraft.error && (
                <MessageBar intent="error">
                  <MessageBarBody>{prepareDraft.error}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              {hasPrepareChanges && unconfirmed && (
                <Button
                  onClick={() => {
                    stay();
                    void boardRef.current?.inspect();
                  }}
                >
                  Inspect saved trip
                </Button>
              )}
              {hasPrepareChanges && !unconfirmed && (
                <Button
                  appearance="primary"
                  disabled={planningBlocked}
                  onClick={() => void boardRef.current?.save()}
                >
                  {prepareDraft.saving ? "Saving..." : "Save to trip"}
                </Button>
              )}
              {!unconfirmed && (
                <Button disabled={saving} onClick={discard}>
                  Leave without saving
                </Button>
              )}
              <Button disabled={saving} onClick={stay}>
                Stay
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </TripPlanningWorkspace>
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
