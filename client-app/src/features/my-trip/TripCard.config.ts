import { TripStatus } from "./domain/Trip.types";

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  active: "Active",
  past: "Past",
  archived: "Archived"
};
