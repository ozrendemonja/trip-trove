import type { Column, TouristDestination } from "../components/Board.types";
import type { Attraction } from "../components/AttractionList.types";
import type {
  TripPlanningChange,
  TripAttractionGroup
} from "../../my-trip/domain/TripPlanning.types";

type PrepareChange = Extract<
  TripPlanningChange,
  { type: "attach" | "remove" | "move" }
>;

export const COLUMN_TO_GROUP: Record<string, TripAttractionGroup> = {
  "Top Attractions": "PRIMARY",
  "Secondary Spots": "SECONDARY",
  "Excluded Attractions": "EXCLUDED"
};

export interface BoardPlacement {
  city: TouristDestination;
  column: Column;
  task: Attraction;
}

export function indexBoard(
  cities: TouristDestination[]
): Map<number, BoardPlacement> {
  return new Map(
    cities.flatMap((city) =>
      city.columns.flatMap((column) =>
        column.tasks.map((task) => [task.id, { city, column, task }] as const)
      )
    )
  );
}

export function sameColumn(
  first: BoardPlacement,
  second: BoardPlacement
): boolean {
  return (
    first.city.name === second.city.name &&
    first.column.title === second.column.title
  );
}

interface WorkingBoard {
  cities: TouristDestination[];
  placements: Map<number, BoardPlacement>;
}

function savedBoard(
  cities: TouristDestination[],
  savedIds: Set<number>
): WorkingBoard {
  const copy = cities.map((city) => ({
    ...city,
    columns: city.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => savedIds.has(task.id))
    }))
  }));
  return { cities: copy, placements: indexBoard(copy) };
}

function targetColumn(
  board: WorkingBoard,
  placement: BoardPlacement
): Pick<BoardPlacement, "city" | "column"> {
  let city = board.cities.find((item) => item.name === placement.city.name);
  if (!city) {
    city = {
      ...placement.city,
      columns: placement.city.columns.map((column) => ({
        ...column,
        tasks: []
      }))
    };
    board.cities.push(city);
  }
  let column = city.columns.find(
    (item) => item.title === placement.column.title
  );
  if (!column) {
    column = { ...placement.column, tasks: [] };
    city.columns.push(column);
  }
  return { city, column };
}

function applyChange(
  board: WorkingBoard,
  draft: Map<number, BoardPlacement>,
  change: PrepareChange
): void {
  const current = board.placements.get(change.attractionId);
  if (current) {
    current.column.tasks.splice(
      current.column.tasks.findIndex((task) => task.id === change.attractionId),
      1
    );
    board.placements.delete(change.attractionId);
  }
  if (change.type === "remove") return;
  const placement = draft.get(change.attractionId);
  if (!placement) {
    throw new Error("The prepared attraction is missing from the draft.");
  }
  const { city, column } = targetColumn(board, placement);
  if (change.type === "attach") {
    column.tasks.push(placement.task);
  } else {
    const previousIndex =
      change.previousAttractionId === null
        ? -1
        : column.tasks.findIndex(
            (task) => task.id === change.previousAttractionId
          );
    if (
      (change.previousAttractionId !== null && previousIndex === -1) ||
      (column.tasks[previousIndex + 1]?.id ?? null) !== change.nextAttractionId
    ) {
      throw new Error("Saved Prepare ordering no longer matches the change.");
    }
    column.tasks.splice(previousIndex + 1, 0, placement.task);
  }
  board.placements.set(change.attractionId, {
    city,
    column,
    task: placement.task
  });
}

export function buildPrepareChanges(
  savedCities: TouristDestination[],
  draftCities: TouristDestination[],
  savedIds: Set<number>,
  movedIds: number[]
): PrepareChange[] {
  const board = savedBoard(savedCities, savedIds);
  const draft = indexBoard(draftCities);
  const moved = new Set(movedIds);
  const changes: PrepareChange[] = [];
  for (const attractionId of savedIds) {
    if (draft.has(attractionId)) continue;
    const change = { type: "remove", attractionId } as const;
    changes.push(change);
    applyChange(board, draft, change);
  }
  for (const city of draftCities) {
    for (const column of city.columns) {
      for (const [index, task] of column.tasks.entries()) {
        const placement = draft.get(task.id);
        if (!placement) {
          throw new Error("The prepared attraction is missing from the draft.");
        }
        let current = board.placements.get(task.id);
        const added = !current;
        if (added) {
          const change: PrepareChange = {
            type: "attach",
            attractionId: task.id,
            attractionGroup: COLUMN_TO_GROUP[column.title]
          };
          changes.push(change);
          applyChange(board, draft, change);
          current = board.placements.get(task.id);
        }
        const previousAttractionId = column.tasks[index - 1]?.id ?? null;
        if (current && sameColumn(current, placement)) {
          if (!added && !moved.has(task.id)) continue;
          const currentIndex = current.column.tasks.findIndex(
            (item) => item.id === task.id
          );
          if (
            (current.column.tasks[currentIndex - 1]?.id ?? null) ===
            previousAttractionId
          ) {
            continue;
          }
        }
        const target = targetColumn(board, placement).column.tasks.filter(
          (item) => item.id !== task.id
        );
        const previousIndex =
          previousAttractionId === null
            ? -1
            : target.findIndex((item) => item.id === previousAttractionId);
        if (previousAttractionId !== null && previousIndex === -1) {
          throw new Error(
            "The previous prepared attraction has not been saved."
          );
        }
        const change: PrepareChange = {
          type: "move",
          attractionId: task.id,
          targetGroup: COLUMN_TO_GROUP[column.title],
          previousAttractionId,
          nextAttractionId: target[previousIndex + 1]?.id ?? null
        };
        changes.push(change);
        applyChange(board, draft, change);
      }
    }
  }
  return changes;
}

export function applyPrepareChanges(
  savedCities: TouristDestination[],
  draftCities: TouristDestination[],
  savedIds: Set<number>,
  changes: PrepareChange[]
): TouristDestination[] {
  const board = savedBoard(savedCities, savedIds);
  const draft = indexBoard(draftCities);
  for (const change of changes) {
    applyChange(board, draft, change);
  }
  return board.cities.filter((city) =>
    city.columns.some((column) => column.tasks.length > 0)
  );
}
