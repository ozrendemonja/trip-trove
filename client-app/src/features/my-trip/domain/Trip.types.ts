export type TripStatus = "active" | "past" | "archived";

export type Rating =
  | "DISLIKED"
  | "BELOW_AVERAGE"
  | "AVERAGE"
  | "VERY_GOOD"
  | "EXCELLENT";

export interface Trip {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  updatedOn?: string;
  status: TripStatus;
}

export interface LastReadTrip {
  tripId: number;
  updatedOn?: string;
}
