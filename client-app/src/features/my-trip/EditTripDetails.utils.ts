import type {
  TripRangeImpactResponse,
  UpdateTripRangeRequest
} from "../../clients/manager";
import { Trip } from "./domain/Trip.types";

export interface TripChanges {
  nameChanged: boolean;
  datesChanged: boolean;
}

const toDateInputValue = (iso?: string): string =>
  iso ? iso.substring(0, 10) : "";

export const detectTripChanges = (
  original: Trip,
  newName: string,
  newStartDate: string,
  newEndDate: string
): TripChanges => ({
  nameChanged: newName.trim() !== original.name,
  datesChanged:
    newStartDate !== toDateInputValue(original.startDate) ||
    newEndDate !== toDateInputValue(original.endDate)
});

const DAY_MS = 86_400_000;

const datesOutside = (
  range: UpdateTripRangeRequest,
  kept: UpdateTripRangeRequest
): string[] => {
  const dates: string[] = [];
  const end = Date.parse(range.toDate);
  for (let time = Date.parse(range.fromDate); time <= end; time += DAY_MS) {
    const date = new Date(time).toISOString().slice(0, 10);
    if (date < kept.fromDate || date > kept.toDate) dates.push(date);
  }
  return dates;
};

export const mapEmptyDates = (
  impact: Pick<
    TripRangeImpactResponse,
    "currentFromDate" | "currentToDate" | "blockers"
  >,
  proposed: UpdateTripRangeRequest
): { added: string[]; removed: string[] } => {
  const current = {
    fromDate: impact.currentFromDate,
    toDate: impact.currentToDate
  };
  // A removed date with content is a blocker, not an empty date.
  const blockedDates = new Set(impact.blockers.map(({ date }) => date));
  return {
    added: datesOutside(proposed, current),
    removed: datesOutside(current, proposed).filter(
      (date) => !blockedDates.has(date)
    )
  };
};
