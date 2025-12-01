import type { TouristDestination } from "../components/Board";
import type { Attraction as BoardAttraction } from "../components/AttractionList";
import {
  Attraction,
  AttractionType
} from "../../continent/domain/Attraction.types";

function toStableFlag(type: AttractionType): boolean {
  return type === AttractionType.STABLE;
}

function mapAttractionToBoardTask(a: Attraction): BoardAttraction {
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
  items: Attraction[]
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
    const topTasks = items.filter((t) => t.mustVisit === true);
    const secondaryTasks = items.filter((t) => t.mustVisit !== true);

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
        { id: `${baseId}_excluded`, title: "Excluded Attractions", tasks: [] }
      ]
    };
    cities.push(city);
  }
  return cities;
}
