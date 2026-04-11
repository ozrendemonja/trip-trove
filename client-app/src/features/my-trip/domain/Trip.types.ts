export type TripStatus = "active" | "past" | "archived";

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
