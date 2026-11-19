import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  useMemo,
  useImperativeHandle
} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Text
} from "@fluentui/react-components";
import { Filter20Regular } from "@fluentui/react-icons";
import AttractionList from "./AttractionList";
import type { Attraction } from "./AttractionList.types";
import "../styles/Board.css";
import {
  updateTripAttraction,
  clearTripAttractionReview,
  fetchTripBoard,
  updateTripAttractionWouldVisitAgain
} from "../../my-trip/infra/TripApi";
import type { TripPlanningChange } from "../../my-trip/domain/TripPlanning.types";
import { useTripPlanningSave } from "../../my-trip/useTripPlanningSave";
import { MarkedPlanningChange } from "../../my-trip/MarkedPlanningChange";
import { Rating } from "../../my-trip/domain/Trip.types";
import type { TouristDestination, BoardProps } from "./Board.types";
import {
  applyVisitHistoryToCities,
  mapSavedTripAttractionsToBoard,
  setPermanentClosureInCities
} from "../utils/Mapper";
import { setAttractionPermanentlyClosed } from "../../continent/infra/ManagerApi";
import ConfirmDeleteDialog from "../../../shared/list-element/ui/delete-dialog/ConfirmDeleteDialog";
import {
  applyPrepareChanges,
  buildPrepareChanges,
  COLUMN_TO_GROUP,
  indexBoard,
  sameColumn,
  type BoardPlacement
} from "../utils/PrepareDraft";

export type { Column, TouristDestination } from "./Board.types";

function restorationIndex(
  removed: BoardPlacement,
  tasks: Attraction[],
  history: Map<number, BoardPlacement>
): number {
  const present = new Set(tasks.map((task) => task.id));
  const reference =
    Array.from(history.values())
      .reverse()
      .find(
        (placement) =>
          sameColumn(placement, removed) &&
          placement.column.tasks.some((task) => task.id === removed.task.id) &&
          placement.column.tasks.some((task) => present.has(task.id))
      ) ?? removed;
  const index = reference.column.tasks.findIndex(
    (task) => task.id === removed.task.id
  );
  const next = reference.column.tasks
    .slice(index + 1)
    .find((task) => present.has(task.id));
  if (next) return tasks.findIndex((task) => task.id === next.id);
  const previous = reference.column.tasks
    .slice(0, index)
    .reverse()
    .find((task) => present.has(task.id));
  return previous ? tasks.findIndex((task) => task.id === previous.id) + 1 : 0;
}

interface DragState {
  fromColumnId: string;
  attractionId: number;
  height: number; // px height of dragged item
}

interface DragUIState {
  overColumnId: string | null;
  insertionIndex: number; // -1 when none
}

// No local sample; expect data to be passed in via props

const Board: React.FC<BoardProps> = ({
  ref,
  initialCities,
  tripId,
  initialReviewData,
  initialSavedAttractionIds,
  onPlanningBlockedChange,
  onPrepareDraftChange,
  visitHistory,
  mode: boardMode
}) => {
  const [cities, setCities] = useState<TouristDestination[]>(
    initialCities ?? []
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragUI, setDragUI] = useState<DragUIState>({
    overColumnId: null,
    insertionIndex: -1
  });
  const readOnly = boardMode !== "edit";
  const isPlanMode = boardMode === "readOnly";
  const reviewMode = boardMode === "review";
  // "prepare" is a staging mode: you may add, remove and re-group attractions
  // (like edit) but per-attraction detail edits are disabled.
  const isPrepare = boardMode === "prepare";
  const canManageAttractions = boardMode === "edit" || boardMode === "prepare";
  const persistImmediately = boardMode === "edit";
  const savedAttractionIdsRef = useRef<Set<number>>(
    new Set(initialSavedAttractionIds ?? [])
  );
  const savedCitiesRef = useRef(initialCities ?? []);
  const previousModeRef = useRef(boardMode);
  // Bumped after a prepare-mode commit to re-render the pending count/button,
  // whose source of truth (saved attraction ids) lives in a ref.
  const [, setCommitVersion] = useState(0);
  const [saveNotice, setSaveNotice] = useState<{ count: number }>();
  const savedPrepareCount = saveNotice?.count ?? 0;
  const activePrepareSave = useRef<Promise<boolean> | null>(null);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState<string>();
  const [inspectedCities, setInspectedCities] =
    useState<TouristDestination[]>();
  // Board moves made in prepare mode, ordered by their latest move.
  const pendingBoardMovesRef = useRef<number[]>([]);
  // Later re-adds may need neighbours from an earlier removal snapshot.
  const removedPlacementsRef = useRef(new Map<number, BoardPlacement>());
  const prepareCityOrderRef = useRef(
    (initialCities ?? []).map((city) => city.name)
  );
  const boardElementRef = useRef<HTMLDivElement>(null);
  const [highlightedAttractionIds, setHighlightedAttractionIds] = useState(
    new Set<number>()
  );
  const [collapsedByCity, setCollapsedByCity] = useState<
    Record<string, boolean>
  >({});
  const [cityPendingRemoval, setCityPendingRemoval] = useState<string | null>(
    null
  );
  const [attractionPendingRemovalId, setAttractionPendingRemovalId] = useState<
    number | null
  >(null);
  const [reviewSelection, setReviewSelection] = useState<
    Record<
      number,
      { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
    >
  >(initialReviewData ?? {});
  const refreshPlanning = useCallback(async () => {
    if (tripId === undefined) {
      throw new Error("A trip is required to refresh planning.");
    }
    const board = await fetchTripBoard(tripId);
    const currentCities = applyVisitHistoryToCities(
      mapSavedTripAttractionsToBoard(board),
      visitHistory
    );
    setCities(currentCities);
    savedCitiesRef.current = currentCities;
    prepareCityOrderRef.current = currentCities.map((city) => city.name);
    savedAttractionIdsRef.current = new Set(
      board.map((item) => item.attractionId)
    );
    pendingBoardMovesRef.current = [];
    setCommitVersion((version) => version + 1);
  }, [tripId, visitHistory]);
  const planning = useTripPlanningSave(tripId, refreshPlanning);
  const {
    submit: submitPlanning,
    save: savePlanning,
    isBlocked: isPlanningBlocked,
    clearSaveError
  } = planning;
  const rejectedChange =
    planning.feedback?.state === "error"
      ? planning.feedback.failedChange
      : undefined;
  const correction = useMemo(
    () =>
      rejectedChange &&
      (rejectedChange.type === "note" ||
        rejectedChange.type === "working-hours" ||
        rejectedChange.type === "visit-time")
        ? {
            attractionId: rejectedChange.attractionId,
            field: rejectedChange.type
          }
        : undefined,
    [rejectedChange]
  );
  const onPlanningCommitted = useCallback((change: TripPlanningChange) => {
    if (change.type === "attach") {
      savedAttractionIdsRef.current.add(change.attractionId);
    } else if (change.type === "remove") {
      savedAttractionIdsRef.current.delete(change.attractionId);
    } else if (change.type === "arrange") {
      pendingBoardMovesRef.current = [];
    }
    setCommitVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    onPlanningBlockedChange?.(planning.blocked);
  }, [onPlanningBlockedChange, planning.blocked]);
  const categoryOptions = [
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
  ] as const;

  interface Filters {
    isCountrywide: "any" | "true" | "false";
    mustVisit: "any" | "true" | "false";
    isTraditional: "any" | "true" | "false";
    stable: "any" | "true" | "false";
    category: "any" | (typeof categoryOptions)[number];
  }
  const [filters, setFilters] = useState<Filters>({
    isCountrywide: "any",
    mustVisit: "any",
    isTraditional: "any",
    stable: "any",
    category: "any"
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();

  const updateFilter =
    (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as Filters[typeof key];
      setFilters((prev) => ({ ...prev, [key]: value }));
    };

  const resetFilters = useCallback(
    () =>
      setFilters({
        isCountrywide: "any",
        mustVisit: "any",
        isTraditional: "any",
        stable: "any",
        category: "any"
      }),
    []
  );

  const matchesFilters = (task: Attraction): boolean =>
    (filters.isCountrywide === "any" ||
      (filters.isCountrywide === "true") === task.isCountrywide) &&
    (filters.mustVisit === "any" ||
      (filters.mustVisit === "true") === task.mustVisit) &&
    (filters.isTraditional === "any" ||
      (filters.isTraditional === "true") === task.isTraditional) &&
    (filters.stable === "any" || (filters.stable === "true") === task.stable) &&
    (filters.category === "any" || filters.category === task.category);

  const onDragStart = useCallback(
    (colId: string, attractionId: number) => (e: React.DragEvent) => {
      if (isPlanningBlocked()) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ""); // required for Firefox
      const element = e.currentTarget as HTMLElement;
      const height = element.getBoundingClientRect().height;
      setDragState({ fromColumnId: colId, attractionId, height });
    },
    [isPlanningBlocked]
  );

  const onDragOverColumn = useCallback(
    (colId: string) => (e: React.DragEvent<HTMLDivElement>) => {
      if (!dragState || isPlanningBlocked()) return;
      e.preventDefault();
      const tasksUl = e.currentTarget.querySelector("ul.attractions");
      if (!tasksUl) return;
      const taskEls = Array.from(tasksUl.children).filter((el) =>
        el.classList.contains("attraction")
      ) as HTMLLIElement[];
      let insertionIndex = taskEls.length;
      for (let i = 0; i < taskEls.length; i++) {
        const rect = taskEls[i].getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          insertionIndex = i;
          break;
        }
      }
      setDragUI((prev) => {
        if (
          prev.overColumnId === colId &&
          prev.insertionIndex === insertionIndex
        )
          return prev;
        return { overColumnId: colId, insertionIndex };
      });
    },
    [dragState, isPlanningBlocked]
  );

  const onDragLeaveColumn = useCallback(
    (colId: string) => (e: React.DragEvent<HTMLDivElement>) => {
      if (!dragState || isPlanningBlocked()) return;
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setDragUI({ overColumnId: null, insertionIndex: -1 });
    },
    [dragState, isPlanningBlocked]
  );

  const onDrop = useCallback(
    (targetColumnId: string, visibleTargetAttractionIds: number[]) =>
      (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragState || isPlanningBlocked()) return;
        let sourceCityIdx = -1,
          sourceColIdx = -1;
        let targetCityIdx = -1,
          targetColIdx = -1;
        for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
          const city = cities[cityIndex];
          const sourceIndex = city.columns.findIndex(
            (column) => column.id === dragState.fromColumnId
          );
          if (sourceIndex !== -1) {
            sourceCityIdx = cityIndex;
            sourceColIdx = sourceIndex;
          }
          const targetIndex = city.columns.findIndex(
            (column) => column.id === targetColumnId
          );
          if (targetIndex !== -1) {
            targetCityIdx = cityIndex;
            targetColIdx = targetIndex;
          }
        }
        if (
          sourceCityIdx === -1 ||
          sourceColIdx === -1 ||
          targetCityIdx === -1 ||
          targetColIdx === -1
        ) {
          return;
        }
        if (sourceCityIdx !== targetCityIdx) {
          setDragState(null);
          setDragUI({ overColumnId: null, insertionIndex: -1 });
          return;
        }

        const nextCities = cities.map((city) => ({
          ...city,
          columns: city.columns.map((column) => ({
            ...column,
            tasks: [...column.tasks]
          }))
        }));
        const sourceColumn = nextCities[sourceCityIdx].columns[sourceColIdx];
        const targetColumn = nextCities[targetCityIdx].columns[targetColIdx];
        const sourceTaskIndex = sourceColumn.tasks.findIndex(
          (task) => task.id === dragState.attractionId
        );
        const attraction = sourceColumn.tasks[sourceTaskIndex];
        if (!attraction) return;

        sourceColumn.tasks.splice(sourceTaskIndex, 1);
        let visibleInsertionIndex =
          dragUI.overColumnId === targetColumnId && dragUI.insertionIndex >= 0
            ? dragUI.insertionIndex
            : visibleTargetAttractionIds.length;
        const draggedVisibleIndex = visibleTargetAttractionIds.indexOf(
          attraction.id
        );
        if (
          sourceColumn === targetColumn &&
          draggedVisibleIndex >= 0 &&
          draggedVisibleIndex < visibleInsertionIndex
        ) {
          visibleInsertionIndex--;
        }
        const visibleIdsAfterRemoval = visibleTargetAttractionIds.filter(
          (attractionId) => attractionId !== attraction.id
        );
        visibleInsertionIndex = Math.max(
          0,
          Math.min(visibleInsertionIndex, visibleIdsAfterRemoval.length)
        );
        const nextVisibleId = visibleIdsAfterRemoval[visibleInsertionIndex];
        const previousVisibleId =
          visibleIdsAfterRemoval[visibleInsertionIndex - 1];
        let insertionIndex = targetColumn.tasks.length;
        if (nextVisibleId !== undefined) {
          insertionIndex = targetColumn.tasks.findIndex(
            (task) => task.id === nextVisibleId
          );
        } else if (previousVisibleId !== undefined) {
          insertionIndex =
            targetColumn.tasks.findIndex(
              (task) => task.id === previousVisibleId
            ) + 1;
        }
        targetColumn.tasks.splice(insertionIndex, 0, attraction);

        const placementChanged =
          sourceColumn !== targetColumn || insertionIndex !== sourceTaskIndex;
        if (placementChanged) {
          const attractionGroup = COLUMN_TO_GROUP[targetColumn.title];
          let accepted = true;
          if (tripId && attractionGroup) {
            if (persistImmediately || isPlanMode) {
              const previousAttraction = targetColumn.tasks[insertionIndex - 1];
              const nextAttraction = targetColumn.tasks[insertionIndex + 1];
              accepted = submitPlanning({
                subjectIds: [attraction.id],
                subjectName: attraction.name,
                description: `Move to ${targetColumn.title}`,
                changes: [
                  {
                    type: "move",
                    attractionId: attraction.id,
                    targetGroup: attractionGroup,
                    previousAttractionId: previousAttraction?.id ?? null,
                    nextAttractionId: nextAttraction?.id ?? null
                  }
                ]
              });
            } else if (isPrepare) {
              pendingBoardMovesRef.current = [
                ...pendingBoardMovesRef.current.filter(
                  (attractionId) => attractionId !== attraction.id
                ),
                attraction.id
              ];
            }
          }
          if (accepted) setCities(nextCities);
        }
        setDragState(null);
        setDragUI({ overColumnId: null, insertionIndex: -1 });
      },
    [
      cities,
      dragState,
      dragUI.insertionIndex,
      dragUI.overColumnId,
      tripId,
      persistImmediately,
      isPlanMode,
      isPrepare,
      submitPlanning,
      isPlanningBlocked
    ]
  );

  const editAttraction = useCallback(
    (
      task: Attraction,
      partial: Partial<Attraction>,
      change: TripPlanningChange,
      description: string
    ) => {
      if (readOnly) return;
      if (
        correction?.attractionId === task.id &&
        correction.field === change.type
      ) {
        clearSaveError();
      }
      if (
        !submitPlanning({
          subjectIds: [task.id],
          subjectName: task.name,
          description,
          changes: [change]
        })
      )
        return;
      setCities((prev) =>
        prev.map((city) => ({
          ...city,
          columns: city.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((item) =>
              item.id === task.id ? { ...item, ...partial } : item
            )
          }))
        }))
      );
    },
    [readOnly, submitPlanning, correction, clearSaveError]
  );

  const toggleAttractionPermanentlyClosed = useCallback(
    (attractionId: number, isClosed: boolean) => {
      if (!isPrepare) return;
      void setAttractionPermanentlyClosed(attractionId, isClosed)
        .then(() => {
          pendingBoardMovesRef.current = [
            ...pendingBoardMovesRef.current.filter((id) => id !== attractionId),
            attractionId
          ];
          setCities((prev) =>
            setPermanentClosureInCities(
              prev,
              attractionId,
              isClosed ? new Date().toISOString() : undefined,
              visitHistory?.get(attractionId)
            )
          );
        })
        .catch((error) =>
          console.error(
            "Failed to save attraction closure status",
            attractionId,
            error
          )
        );
    },
    [isPrepare, visitHistory]
  );

  // Generic update by attraction id (hidden internal id).
  const updateAttractionById = useCallback(
    (attractionId: number, partial: Partial<Attraction>) => {
      if (readOnly) return;
      setCities((prev) =>
        prev.map((city) => ({
          ...city,
          columns: city.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) =>
              t.id === attractionId ? { ...t, ...partial } : t
            )
          }))
        }))
      );
    },
    [readOnly]
  );

  // Upsert a batch of attractions into a column by id, avoiding duplicates.
  const upsertAttractions = useCallback(
    (columnId: string, newAttractions: Attraction[]) => {
      if (readOnly) return;
      setCities((prev) =>
        prev.map((city) => ({
          ...city,
          columns: city.columns.map((col) => {
            if (col.id !== columnId) return col;
            const existingMap = new Map(
              col.tasks.map((t) => [t.id, t] as const)
            );
            for (const incoming of newAttractions) {
              if (existingMap.has(incoming.id)) {
                existingMap.set(incoming.id, {
                  ...existingMap.get(incoming.id)!,
                  ...incoming
                });
              } else {
                existingMap.set(incoming.id, incoming);
              }
            }
            return { ...col, tasks: Array.from(existingMap.values()) };
          })
        }))
      );
    },
    [readOnly]
  );

  // Sync internal state when initialCities prop changes
  useEffect(() => {
    if (isPlanningBlocked()) return;
    // Always sync to prop, even when it's an empty array initially
    const next = initialCities ?? [];
    setCities(next);
    savedCitiesRef.current = next;
    prepareCityOrderRef.current = next.map((city) => city.name);
    setDragState(null);
    setDragUI({ overColumnId: null, insertionIndex: -1 });
    // Preserve existing collapse states; initialize new city keys to false
    setCollapsedByCity((prev) => {
      const merged: Record<string, boolean> = { ...prev };
      for (const c of next) {
        if (!(c.name in merged)) merged[c.name] = false;
      }
      return merged;
    });
  }, [initialCities, isPlanningBlocked]);

  useEffect(() => {
    if (previousModeRef.current !== "prepare" && isPrepare) {
      savedCitiesRef.current = cities;
      prepareCityOrderRef.current = cities.map((city) => city.name);
      pendingBoardMovesRef.current = [];
      removedPlacementsRef.current.clear();
    }
    previousModeRef.current = boardMode;
  }, [boardMode, cities, isPrepare]);

  // Sync saved IDs when prop changes (e.g. after DB load)
  useEffect(() => {
    if (initialSavedAttractionIds) {
      for (const id of initialSavedAttractionIds) {
        savedAttractionIdsRef.current.add(id);
      }
      setCommitVersion((v) => v + 1);
    }
  }, [initialSavedAttractionIds]);

  // Sync review selection when initialReviewData changes
  useEffect(() => {
    if (initialReviewData) {
      setReviewSelection((prev) => ({ ...prev, ...initialReviewData }));
    }
  }, [initialReviewData]);

  const prepareChanges = isPrepare
    ? buildPrepareChanges(
        savedCitiesRef.current,
        cities,
        savedAttractionIdsRef.current,
        pendingBoardMovesRef.current
      )
    : [];
  const pendingCommitCount = new Set(
    prepareChanges.map((change) => change.attractionId)
  ).size;
  const commitPreparedChanges = useCallback((): Promise<boolean> => {
    if (activePrepareSave.current) return activePrepareSave.current;
    if (isPlanningBlocked()) return Promise.resolve(false);
    if (pendingCommitCount === 0) return Promise.resolve(true);
    const changes = buildPrepareChanges(
      savedCitiesRef.current,
      cities,
      savedAttractionIdsRef.current,
      pendingBoardMovesRef.current
    );
    // An attachment may succeed before its placement, including a lost reply.
    pendingBoardMovesRef.current = Array.from(
      new Set([
        ...pendingBoardMovesRef.current,
        ...changes
          .filter((change) => change.type === "attach")
          .map((change) => change.attractionId)
      ])
    );
    let committedCount = 0;
    const savedIds = new Set<number>();
    const save = savePlanning({
      subjectIds: Array.from(
        new Set(changes.map((change) => change.attractionId))
      ),
      subjectName: "prepared attractions",
      description: "Save prepared attractions",
      changes,
      allowRetryAfterRejection: true,
      onCommitted: () => {
        const change = changes[committedCount];
        savedCitiesRef.current = applyPrepareChanges(
          savedCitiesRef.current,
          cities,
          savedAttractionIdsRef.current,
          [change]
        );
        savedAttractionIdsRef.current = new Set(
          indexBoard(savedCitiesRef.current).keys()
        );
        committedCount++;
        savedIds.add(change.attractionId);
        if (committedCount === changes.length) {
          savedCitiesRef.current = cities;
          prepareCityOrderRef.current = cities.map((city) => city.name);
          pendingBoardMovesRef.current = [];
        }
        for (const id of removedPlacementsRef.current.keys()) {
          if (!savedAttractionIdsRef.current.has(id)) {
            removedPlacementsRef.current.delete(id);
          }
        }
      }
    }).finally(() => {
      if (savedIds.size > 0) setSaveNotice({ count: savedIds.size });
      setCommitVersion((version) => version + 1);
      activePrepareSave.current = null;
    });
    activePrepareSave.current = save;
    return save;
  }, [cities, pendingCommitCount, isPlanningBlocked, savePlanning]);

  const addPreparedAttractions = useCallback(
    (incomingCities: TouristDestination[]): void => {
      if (!isPrepare || isPlanningBlocked()) {
        throw new Error(
          "Resolve the pending planning change before adding attractions in Prepare."
        );
      }
      const ids = new Set(indexBoard(cities).keys());
      const addedIds: number[] = [];
      const next = cities.map((city) => ({
        ...city,
        columns: city.columns.map((column) => ({
          ...column,
          tasks: [...column.tasks]
        }))
      }));
      for (const incomingCity of incomingCities) {
        for (const incomingColumn of incomingCity.columns) {
          for (const incomingTask of incomingColumn.tasks) {
            if (ids.has(incomingTask.id)) continue;
            const removed = removedPlacementsRef.current.get(incomingTask.id);
            const sourceCity = removed?.city ?? incomingCity;
            const sourceColumn = removed?.column ?? incomingColumn;
            const task = removed
              ? {
                  ...incomingTask,
                  mustVisit: removed.task.mustVisit,
                  note: removed.task.note,
                  workingHours: removed.task.workingHours,
                  VisitTime: removed.task.VisitTime
                }
              : incomingTask;
            let city = next.find((item) => item.name === sourceCity.name);
            if (!city) {
              city = {
                ...sourceCity,
                columns: sourceCity.columns.map((column) => ({
                  ...column,
                  tasks: []
                }))
              };
              if (!prepareCityOrderRef.current.includes(city.name)) {
                prepareCityOrderRef.current.push(city.name);
              }
              const rank = prepareCityOrderRef.current.indexOf(city.name);
              const index = next.findIndex(
                (item) => prepareCityOrderRef.current.indexOf(item.name) > rank
              );
              next.splice(index < 0 ? next.length : index, 0, city);
            }
            const column = city.columns.find(
              (item) => item.title === sourceColumn.title
            );
            if (!column) {
              throw new Error(
                "The attraction's board column could not be found."
              );
            }
            const index = removed
              ? restorationIndex(
                  removed,
                  column.tasks,
                  removedPlacementsRef.current
                )
              : column.tasks.length;
            column.tasks.splice(index, 0, task);
            ids.add(task.id);
            addedIds.push(task.id);
          }
        }
      }
      setCities(next);
      if (addedIds.length === 0) return;
      const added = new Set(addedIds);
      resetFilters();
      setCollapsedByCity((previous) => {
        const expanded = { ...previous };
        for (const city of next) {
          if (
            city.columns.some((column) =>
              column.tasks.some((task) => added.has(task.id))
            )
          ) {
            expanded[city.name] = false;
          }
        }
        return expanded;
      });
      setHighlightedAttractionIds(added);
    },
    [cities, isPrepare, isPlanningBlocked, resetFilters]
  );

  useEffect(() => {
    if (highlightedAttractionIds.size === 0) return;
    boardElementRef.current
      ?.querySelector<HTMLElement>('[data-just-added="true"]')
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = window.setTimeout(
      () => setHighlightedAttractionIds(new Set()),
      2500
    );
    return () => window.clearTimeout(timer);
  }, [highlightedAttractionIds]);

  const discardPreparedChanges = useCallback((): void => {
    if (planning.feedback?.state === "saving") return;
    setCities(
      savedCitiesRef.current
        .map((city) => ({
          ...city,
          columns: city.columns.map((column) => ({
            ...column,
            tasks: column.tasks.filter((task) =>
              savedAttractionIdsRef.current.has(task.id)
            )
          }))
        }))
        .filter((city) =>
          city.columns.some((column) => column.tasks.length > 0)
        )
    );
    pendingBoardMovesRef.current = [];
    removedPlacementsRef.current.clear();
    prepareCityOrderRef.current = savedCitiesRef.current.map(
      (city) => city.name
    );
    setSaveNotice(undefined);
    clearSaveError();
  }, [clearSaveError, planning.feedback?.state]);

  const inspectSavedPlanning = useCallback(async (): Promise<void> => {
    if (tripId === undefined) return;
    setInspectionOpen(true);
    if (inspectionLoading) return;
    setInspectionLoading(true);
    setInspectionError(undefined);
    setInspectedCities(undefined);
    try {
      const saved = await fetchTripBoard(tripId);
      setInspectedCities(mapSavedTripAttractionsToBoard(saved));
    } catch (error) {
      setInspectionError(
        error instanceof Error
          ? error.message
          : "Saved planning couldn't be loaded. Your draft is still here."
      );
    } finally {
      setInspectionLoading(false);
    }
  }, [inspectionLoading, tripId]);

  const acceptInspectedPlanning = (keepDraft: boolean): void => {
    if (!inspectedCities) return;
    const previouslySaved = savedAttractionIdsRef.current;
    savedCitiesRef.current = inspectedCities;
    savedAttractionIdsRef.current = new Set(
      inspectedCities.flatMap((city) =>
        city.columns.flatMap((column) => column.tasks.map((task) => task.id))
      )
    );
    for (const id of previouslySaved) {
      if (!savedAttractionIdsRef.current.has(id))
        removedPlacementsRef.current.delete(id);
    }
    if (!keepDraft) {
      setCities(inspectedCities);
      pendingBoardMovesRef.current = [];
      removedPlacementsRef.current.clear();
      prepareCityOrderRef.current = inspectedCities.map((city) => city.name);
    } else {
      const relevantCities = new Set(
        [...inspectedCities, ...cities].map((city) => city.name)
      );
      prepareCityOrderRef.current = prepareCityOrderRef.current.filter((name) =>
        relevantCities.has(name)
      );
    }
    setCommitVersion((version) => version + 1);
    clearSaveError();
    setInspectionOpen(false);
  };

  useImperativeHandle(
    ref,
    () => ({
      addAttractions: addPreparedAttractions,
      save: commitPreparedChanges,
      discard: discardPreparedChanges,
      inspect: inspectSavedPlanning
    }),
    [
      addPreparedAttractions,
      commitPreparedChanges,
      discardPreparedChanges,
      inspectSavedPlanning
    ]
  );

  useEffect(() => {
    onPrepareDraftChange?.({
      count: pendingCommitCount,
      saving: isPrepare && planning.feedback?.state === "saving",
      savedCount: savedPrepareCount,
      unconfirmed:
        isPrepare &&
        planning.feedback?.state === "error" &&
        planning.feedback.unconfirmed,
      error:
        isPrepare && planning.feedback?.state === "error"
          ? planning.feedback.message
          : undefined
    });
  }, [
    onPrepareDraftChange,
    isPrepare,
    pendingCommitCount,
    planning.feedback?.message,
    planning.feedback?.unconfirmed,
    planning.feedback?.state,
    savedPrepareCount
  ]);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(undefined), 6000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const toggleCityCollapse = useCallback((cityName: string) => {
    setCollapsedByCity((prev) => ({ ...prev, [cityName]: !prev[cityName] }));
  }, []);

  const removeAttraction = useCallback(
    (attractionId: number) => {
      if (!canManageAttractions) return;
      const task = cities
        .flatMap((city) => city.columns)
        .flatMap((column) => column.tasks)
        .find((task) => task.id === attractionId);
      if (isPrepare) {
        const placement = indexBoard(cities).get(attractionId);
        if (placement) {
          removedPlacementsRef.current.delete(attractionId);
          removedPlacementsRef.current.set(attractionId, placement);
        }
      }
      if (
        persistImmediately &&
        !submitPlanning({
          subjectIds: [attractionId],
          subjectName: task?.name ?? "removed attraction",
          description: `Remove ${task?.name ?? "attraction"} from trip`,
          changes: [{ type: "remove", attractionId }],
          onCommitted: onPlanningCommitted
        })
      )
        return;
      setCities((prev) =>
        prev
          .map((city) => ({
            ...city,
            columns: city.columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== attractionId)
            }))
          }))
          .filter((city) => city.columns.some((col) => col.tasks.length > 0))
      );
      // In prepare mode the removal is staged locally and reconciled on commit.
    },
    [
      canManageAttractions,
      persistImmediately,
      isPrepare,
      cities,
      submitPlanning,
      onPlanningCommitted
    ]
  );

  const removeAllFromCity = useCallback(
    (cityName: string) => {
      if (!canManageAttractions) return;
      const city = cities.find((c) => c.name === cityName);
      if (!city) return;
      const attractionIds = city.columns.flatMap((col) =>
        col.tasks.map((t) => t.id)
      );
      if (isPrepare) {
        const placements = indexBoard(cities);
        for (const id of attractionIds) {
          const placement = placements.get(id);
          if (placement) {
            removedPlacementsRef.current.delete(id);
            removedPlacementsRef.current.set(id, placement);
          }
        }
      }
      if (
        persistImmediately &&
        !submitPlanning({
          subjectIds: attractionIds,
          subjectName: cityName,
          description: `Remove all attractions from ${cityName}`,
          changes: attractionIds.map((attractionId) => ({
            type: "remove",
            attractionId
          })),
          onCommitted: onPlanningCommitted
        })
      )
        return;
      setCities((prev) => prev.filter((c) => c.name !== cityName));
    },
    [
      canManageAttractions,
      persistImmediately,
      isPrepare,
      cities,
      submitPlanning,
      onPlanningCommitted
    ]
  );

  const handleAttachAttraction = useCallback(
    async (attractionId: number, ratingValue: Rating, reviewNote: string) => {
      if (!tripId) return;
      try {
        await updateTripAttraction(
          tripId,
          attractionId,
          ratingValue,
          reviewNote || undefined
        );
        setReviewSelection((prev) => ({
          ...prev,
          [attractionId]: {
            rating: ratingValue,
            reviewNote,
            wouldVisitAgain: prev[attractionId]?.wouldVisitAgain ?? false
          }
        }));
      } catch (err) {
        console.error("Failed to save review", attractionId, err);
      }
    },
    [tripId]
  );

  const handleToggleWouldVisitAgain = useCallback(
    async (attractionId: number) => {
      if (!tripId) return;
      const current = reviewSelection[attractionId];
      if (!current) return;
      const next = !current.wouldVisitAgain;
      try {
        await updateTripAttractionWouldVisitAgain(tripId, attractionId, next);
        setReviewSelection((prev) => ({
          ...prev,
          [attractionId]: { ...prev[attractionId], wouldVisitAgain: next }
        }));
      } catch (err) {
        console.error("Failed to update would visit again", attractionId, err);
      }
    },
    [tripId, reviewSelection]
  );

  const handleDetachAttraction = useCallback(
    async (attractionId: number) => {
      if (!tripId) return;
      await clearTripAttractionReview(tripId, attractionId);
      setReviewSelection((prev) => {
        const next = { ...prev };
        delete next[attractionId];
        return next;
      });
    },
    [tripId]
  );

  const markedChange = planning.feedback ? (
    <MarkedPlanningChange
      feedback={planning.feedback}
      onReload={() =>
        void (isPrepare ? inspectSavedPlanning() : planning.reload())
      }
    />
  ) : null;
  const hasFeedbackHost = cities.some(
    (city) =>
      !collapsedByCity[city.name] &&
      city.columns.some((column) =>
        column.tasks.some(
          (task) =>
            matchesFilters(task) &&
            planning.feedback?.proposal.subjectIds.includes(task.id)
        )
      )
  );

  return (
    <div className="attraction-board-wrapper" ref={boardElementRef}>
      <Dialog
        open={inspectionOpen}
        onOpenChange={(_event, data) => {
          if (!data.open) setInspectionOpen(false);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Inspect saved trip</DialogTitle>
            <DialogContent>
              <Text>
                Compare the saved board with your Prepare draft before choosing
                what to keep. No save will be repeated automatically.
              </Text>
              {inspectionLoading && <Spinner label="Loading saved trip" />}
              {inspectionError && (
                <MessageBar intent="error">
                  <MessageBarBody>{inspectionError}</MessageBarBody>
                </MessageBar>
              )}
              {inspectedCities?.length === 0 && <p>The saved trip is empty.</p>}
              {inspectedCities?.map((city) => (
                <section key={city.name} aria-label={city.name}>
                  <Text as="h3" weight="semibold">
                    {city.name}
                  </Text>
                  {city.columns
                    .filter((column) => column.tasks.length > 0)
                    .map((column) => (
                      <div key={column.id}>
                        <Text weight="semibold">{column.title}</Text>
                        <ul>
                          {column.tasks.map((task) => (
                            <li key={task.id}>{task.name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </section>
              ))}
            </DialogContent>
            <DialogActions>
              {inspectedCities && (
                <>
                  <Button
                    appearance="primary"
                    onClick={() => acceptInspectedPlanning(true)}
                  >
                    Keep draft
                  </Button>
                  <Button onClick={() => acceptInspectedPlanning(false)}>
                    Use saved trip
                  </Button>
                </>
              )}
              {inspectionError && (
                <Button onClick={() => void inspectSavedPlanning()}>
                  Load saved trip again
                </Button>
              )}
              <Button onClick={() => setInspectionOpen(false)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <div className="board-toolbar">
        {planning.blocked && (
          <Text size={200}>
            {planning.feedback?.state === "saving"
              ? "Saving a planning change. Further edits wait."
              : "Resolve the marked change before making another edit."}
          </Text>
        )}
        <Button
          appearance="subtle"
          size="small"
          icon={<Filter20Regular />}
          aria-expanded={filtersOpen}
          aria-controls={filtersOpen ? filtersId : undefined}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters on demand
        </Button>
        {filtersOpen && (
          <div className="filters-row" id={filtersId}>
            <Field label="Countrywide" size="small">
              <Select
                size="small"
                value={filters.isCountrywide}
                onChange={updateFilter("isCountrywide")}
              >
                <option value="any">Any</option>
                <option value="true">Countrywide</option>
                <option value="false">Local</option>
              </Select>
            </Field>
            <Field label="Must Visit" size="small">
              <Select
                size="small"
                value={filters.mustVisit}
                onChange={updateFilter("mustVisit")}
              >
                <option value="any">Any</option>
                <option value="true">Must visit</option>
                <option value="false">Skip-Worthy Spots</option>
              </Select>
            </Field>
            <Field label="Traditional" size="small">
              <Select
                size="small"
                value={filters.isTraditional}
                onChange={updateFilter("isTraditional")}
              >
                <option value="any">Any</option>
                <option value="true">Traditional</option>
                <option value="false">Modern</option>
              </Select>
            </Field>
            <Field label="Stability" size="small">
              <Select
                size="small"
                value={filters.stable}
                onChange={updateFilter("stable")}
              >
                <option value="any">Any</option>
                <option value="true">Stable</option>
                <option value="false">Potential Change</option>
              </Select>
            </Field>
            <Field label="Category" size="small">
              <Select
                size="small"
                value={filters.category}
                onChange={updateFilter("category")}
              >
                <option value="any">Any</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </Field>
            <Button size="small" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
      {!hasFeedbackHost && markedChange}
      {cities.map((city) => {
        // Check if all attractions are in the excluded column (last column)
        const excludedColumn = city.columns.find(
          (col) => col.title === "Excluded Attractions"
        );
        const nonExcludedColumns = city.columns.filter(
          (col) => col.title !== "Excluded Attractions"
        );
        const allInExcluded =
          nonExcludedColumns.every((col) => col.tasks.length === 0) &&
          excludedColumn &&
          excludedColumn.tasks.length > 0;
        const isCollapsed = collapsedByCity[city.name];
        const showGray = isCollapsed && allInExcluded;

        return (
          <div
            key={city.name}
            className={`city-group${showGray ? " all-excluded" : ""}`}
          >
            <div className="city-header">
              <button
                type="button"
                className="city-collapse-btn"
                onClick={() => toggleCityCollapse(city.name)}
                aria-label={
                  isCollapsed ? `Expand ${city.name}` : `Collapse ${city.name}`
                }
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>
              <h1 className="city-title">{city.name}</h1>
              {canManageAttractions && (
                <button
                  type="button"
                  className="city-remove-all-btn"
                  disabled={planning.blocked}
                  onClick={() => setCityPendingRemoval(city.name)}
                  title="Remove all attractions from this location"
                  aria-label={`Remove all attractions from ${city.name}`}
                >
                  🗑 Remove all
                </button>
              )}
            </div>
            {!collapsedByCity[city.name] && (
              <div className="attraction-board">
                {city.columns.map((col) => {
                  const showPlaceholder =
                    dragState && dragUI.overColumnId === col.id;
                  // Apply filtering to tasks
                  const filteredTasks = col.tasks.filter(matchesFilters);
                  return (
                    <div
                      key={col.id}
                      className="attraction-board-column"
                      onDragOver={onDragOverColumn(col.id)}
                      onDragLeave={onDragLeaveColumn(col.id)}
                      onDrop={onDrop(
                        col.id,
                        filteredTasks.map((task) => task.id)
                      )}
                    >
                      <h2>{col.title}</h2>
                      <AttractionList
                        attractions={filteredTasks}
                        highlightedAttractionIds={highlightedAttractionIds}
                        showPlaceholder={!!showPlaceholder}
                        insertionIndex={dragUI.insertionIndex}
                        placeholderHeight={dragState?.height}
                        onDragStart={(attractionId) =>
                          onDragStart(col.id, attractionId)
                        }
                        columnId={col.id}
                        locationHint={city.name}
                        onUpdateNote={(_column, index, note) =>
                          editAttraction(
                            filteredTasks[index],
                            { note },
                            {
                              type: "note",
                              attractionId: filteredTasks[index].id,
                              note: note || null
                            },
                            `Trip note: ${note || "(empty)"}`
                          )
                        }
                        onUpdateWorkingHours={(_column, index, workingHours) =>
                          editAttraction(
                            filteredTasks[index],
                            { workingHours: workingHours || undefined },
                            {
                              type: "working-hours",
                              attractionId: filteredTasks[index].id,
                              workingHours: workingHours || null
                            },
                            `Working hours: ${workingHours || "(empty)"}`
                          )
                        }
                        onUpdateVisitTime={(_column, index, visitTime) =>
                          editAttraction(
                            filteredTasks[index],
                            { VisitTime: visitTime },
                            {
                              type: "visit-time",
                              attractionId: filteredTasks[index].id,
                              visitTime: visitTime || null
                            },
                            `Visit duration: ${visitTime || "(empty)"}`
                          )
                        }
                        onToggleMustVisit={(_column, index) =>
                          editAttraction(
                            filteredTasks[index],
                            { mustVisit: !filteredTasks[index].mustVisit },
                            {
                              type: "must-visit",
                              attractionId: filteredTasks[index].id,
                              mustVisit: !filteredTasks[index].mustVisit
                            },
                            filteredTasks[index].mustVisit
                              ? "Unmark must visit"
                              : "Mark must visit"
                          )
                        }
                        onTogglePermanentlyClosed={
                          isPrepare
                            ? toggleAttractionPermanentlyClosed
                            : undefined
                        }
                        onDeleteTask={setAttractionPendingRemovalId}
                        updateById={updateAttractionById}
                        upsertAttractions={upsertAttractions}
                        readOnly={readOnly}
                        planningDisabled={planning.blocked}
                        correction={correction}
                        renderPlanningFeedback={(attractionId) =>
                          planning.feedback?.proposal.subjectIds.includes(
                            attractionId
                          )
                            ? markedChange
                            : null
                        }
                        canManageAttractions={canManageAttractions}
                        reviewMode={reviewMode}
                        reviewSelection={reviewSelection}
                        onAttachAttraction={handleAttachAttraction}
                        onDetachAttraction={handleDetachAttraction}
                        onToggleWouldVisitAgain={handleToggleWouldVisitAgain}
                        visitHistory={visitHistory}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <ConfirmDeleteDialog
        name={
          cities
            .flatMap((city) => city.columns)
            .flatMap((column) => column.tasks)
            .find((task) => task.id === attractionPendingRemovalId)?.name ?? ""
        }
        hidden={attractionPendingRemovalId === null}
        onConfirm={() => {
          if (attractionPendingRemovalId !== null) {
            removeAttraction(attractionPendingRemovalId);
          }
          setAttractionPendingRemovalId(null);
        }}
        onDismiss={() => setAttractionPendingRemovalId(null)}
      />
      <ConfirmDeleteDialog
        name={
          cityPendingRemoval ? `all attractions in ${cityPendingRemoval}` : ""
        }
        hidden={cityPendingRemoval === null}
        onConfirm={() => {
          if (cityPendingRemoval) removeAllFromCity(cityPendingRemoval);
          setCityPendingRemoval(null);
        }}
        onDismiss={() => setCityPendingRemoval(null)}
      />
    </div>
  );
};

export default Board;
