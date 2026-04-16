export type TripStatus = "active" | "past" | "archived";

<<<<<<< HEAD
export type Rating =
  | "DISLIKED"
  | "BELOW_AVERAGE"
  | "AVERAGE"
  | "VERY_GOOD"
  | "EXCELLENT";

=======
>>>>>>> main
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
