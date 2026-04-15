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
