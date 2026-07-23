import type { Attraction } from "./AttractionList.types";
import type { Rating } from "../../my-trip/domain/Trip.types";
import type { VisitHistoryMap } from "../utils/Mapper";

export interface Column {
  id: string;
  title: string;
  tasks: Attraction[];
}

export interface TouristDestination {
  name: string;
  columns: Column[];
}

export type BoardMode = "edit" | "prepare" | "readOnly" | "review";

export interface BoardProps {
  initialCities?: TouristDestination[]; // optional; defaults to empty
  onCitiesLoaded?: (cities: TouristDestination[]) => void; // callback when cities are loaded from file
  tripId?: number; // needed for review mode (attach/detach attractions)
  initialReviewData?: Record<
    number,
    { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
  >; // pre-populated review ratings/notes/flags from DB
  initialSavedAttractionIds?: number[]; // attraction IDs already saved in DB (skip re-saving)
  visitHistory?: VisitHistoryMap; // visit history per attraction id (other trips)
  // Landing mode chosen by the container once the trip data is known (review
  // when archived, prepare for a new/empty trip, otherwise edit). Applied once.
  initialMode?: BoardMode;
}
