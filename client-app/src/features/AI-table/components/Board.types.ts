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
  mode: BoardMode;
  initialCities?: TouristDestination[]; // optional; defaults to empty
  tripId?: number; // needed to persist board changes and attraction reviews
  initialReviewData?: Record<
    number,
    { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
  >; // pre-populated review ratings/notes/flags from DB
  initialSavedAttractionIds?: number[]; // attraction IDs already saved in DB (skip re-saving)
  visitHistory?: VisitHistoryMap; // visit history per attraction id (other trips)
}
