import { Rating } from "./Trip.types";

export interface VisitHistoryEntry {
  tripId: number;
  tripName: string;
  tripFromDate?: string;
  tripToDate?: string;
  rating: Rating;
  reviewNote?: string;
  wouldVisitAgain?: boolean;
}

export interface AttractionVisitHistory {
  attractionId: number;
  visits: VisitHistoryEntry[];
}
