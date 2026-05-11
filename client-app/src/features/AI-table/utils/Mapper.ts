import type { TouristDestination } from "../components/Board.types";
import type { Attraction as BoardAttraction } from "../components/AttractionList.types";
import {
  Attraction,
  AttractionType
} from "../../continent/domain/Attraction.types";
import type {
  AttractionVisitHistory,
  VisitHistoryEntry
} from "../../my-trip/domain/VisitHistory.types";
import type { Rating } from "../../my-trip/domain/Trip.types";

function toStableFlag(type: AttractionType): boolean {
  return type === AttractionType.STABLE;
}

const RATING_SCORE: Record<Rating, number> = {
  DISLIKED: 1,
  BELOW_AVERAGE: 2,
  AVERAGE: 3,
  VERY_GOOD: 4,
  EXCELLENT: 5
};

const GOOD_REVIEW_THRESHOLD = RATING_SCORE.VERY_GOOD;

export type VisitHistoryMap = Map<number, VisitHistoryEntry[]>;

export function buildVisitHistoryMap(
  history: AttractionVisitHistory[]
): VisitHistoryMap {
  const map: VisitHistoryMap = new Map();
  for (const entry of history) {
    map.set(entry.attractionId, entry.visits ?? []);
  }
  return map;
}

/**
 * Returns the most recent visit (latest tripToDate). Backend already orders
 * DESC, so we take the first; we still defensively sort in case input is mixed.
 */
function latestVisit(
  visits: VisitHistoryEntry[]
): VisitHistoryEntry | undefined {
  if (!visits || visits.length === 0) return undefined;
  return [...visits].sort((a, b) => {
    const ad = a.tripToDate || "";
    const bd = b.tripToDate || "";
    return bd.localeCompare(ad);
  })[0];
}

export function pickColumnForAttraction(
  attraction: BoardAttraction,
  visits: VisitHistoryEntry[] | undefined
): "top" | "secondary" | "excluded" {
  const last = latestVisit(visits ?? []);
  if (last) {
    if (last.wouldVisitAgain === false) return "excluded";
    if (last.rating && RATING_SCORE[last.rating] < GOOD_REVIEW_THRESHOLD) {
      return "excluded";
    }
    return "secondary";
  }
  return attraction.mustVisit ? "top" : "secondary";
}

export function mapAttractionToBoardTask(a: Attraction): BoardAttraction {
  return {
    id: a.id,
    mustVisit: a.mustVisit,
    stable: toStableFlag(a.type),
    isTraditional: a.isTraditional,
    isCountrywide: a.destination.isCountrywide,
    name: a.name.name,
    address: a.address.streetAddress || "",
    category: a.category,
    infoFrom: a.infoFrom.source + " " + a.infoFrom.recorded,
    note: a.tip || "",
    optimalVisitPeriod: a.optimalVisitPeriod
      ? `${a.optimalVisitPeriod.fromDate} - ${a.optimalVisitPeriod.toDate}`
      : undefined,
    workingHours: undefined,
    VisitTime: ""
  };
}

export function mapServerResponseToTouristDestinations(
  items: Attraction[],
  visitHistoryMap?: VisitHistoryMap
): TouristDestination[] {
  const groups = new Map<string, BoardAttraction[]>();
  for (const a of items) {
    const cityOrRegion =
      a.destination.cityName?.trim() || a.destination.regionName.trim();
    const key = cityOrRegion || a.destination.countryName;
    const task = mapAttractionToBoardTask(a);
    const arr = groups.get(key) || [];
    arr.push(task);
    groups.set(key, arr);
  }

  const cities: TouristDestination[] = [];
  for (const [cityName, items] of groups.entries()) {
    const topTasks: BoardAttraction[] = [];
    const secondaryTasks: BoardAttraction[] = [];
    const excludedTasks: BoardAttraction[] = [];

    for (const t of items) {
      const visits = visitHistoryMap?.get(t.id);
      const target = pickColumnForAttraction(t, visits);
      if (target === "top") topTasks.push(t);
      else if (target === "excluded") excludedTasks.push(t);
      else secondaryTasks.push(t);
    }

    const baseId = cityName.toLowerCase().replace(/\s+/g, "_");
    const city: TouristDestination = {
      name: cityName,
      columns: [
        { id: `${baseId}_top`, title: "Top Attractions", tasks: topTasks },
        {
          id: `${baseId}_secondary`,
          title: "Secondary Spots",
          tasks: secondaryTasks
        },
        {
          id: `${baseId}_excluded`,
          title: "Excluded Attractions",
          tasks: excludedTasks
        }
      ]
    };
    cities.push(city);
  }
  return cities;
}

const STANDARD_COLUMN_TITLES = {
  top: "Top Attractions",
  secondary: "Secondary Spots",
  excluded: "Excluded Attractions"
} as const;

type ColumnTarget = keyof typeof STANDARD_COLUMN_TITLES;

function titleToTarget(title: string): ColumnTarget | undefined {
  const entry = Object.entries(STANDARD_COLUMN_TITLES).find(
    ([, value]) => value === title
  );
  return entry?.[0] as ColumnTarget | undefined;
}

/**
 * Re-distributes tasks across each city's three standard columns based on
 * visit history. Tasks whose latest visit rating is below VERY_GOOD move to
 * "Excluded Attractions"; tasks without history stay in their current column.
 * Non-standard columns are left untouched.
 */
export function applyVisitHistoryToCities(
  cities: TouristDestination[],
  visitHistoryMap: VisitHistoryMap | undefined
): TouristDestination[] {
  if (!visitHistoryMap || visitHistoryMap.size === 0) return cities;

  return cities.map((city) => {
    const tasksByTarget: Record<ColumnTarget, BoardAttraction[]> = {
      top: [],
      secondary: [],
      excluded: []
    };

    let movedAny = false;
    let hasStandardColumn = false;

    for (const col of city.columns) {
      const sourceTarget = titleToTarget(col.title);
      if (!sourceTarget) continue;
      hasStandardColumn = true;

      for (const task of col.tasks) {
        const visits = visitHistoryMap.get(task.id);
        const latest = latestVisit(visits ?? []);
        const shouldExclude =
          latest !== undefined &&
          (latest.wouldVisitAgain === false ||
            RATING_SCORE[latest.rating] < GOOD_REVIEW_THRESHOLD);
        const target: ColumnTarget = shouldExclude ? "excluded" : sourceTarget;
        tasksByTarget[target].push(task);
        if (target !== sourceTarget) movedAny = true;
      }
    }

    if (!hasStandardColumn || !movedAny) return city;

    return {
      ...city,
      columns: city.columns.map((col) => {
        const target = titleToTarget(col.title);
        return target ? { ...col, tasks: tasksByTarget[target] } : col;
      })
    };
  });
}
