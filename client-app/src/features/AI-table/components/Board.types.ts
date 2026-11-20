import type { Attraction } from "./AttractionList.types";
import type { Rating } from "../../my-trip/domain/Trip.types";
import type { VisitHistoryMap } from "../utils/Mapper";
import type { Ref } from "react";

export interface Column {
  id: string;
  title: string;
  tasks: Attraction[];
}

export interface TouristDestination {
  name: string;
  columns: Column[];
}

export type BoardMode =
  "edit" | "prepare" | "itinerary" | "readOnly" | "review";

export interface PrepareDraftState {
  count: number;
  saving: boolean;
  savedCount: number;
  error?: string;
  unconfirmed?: boolean;
}

export interface PrepareBoardHandle {
  addAttractions: (cities: TouristDestination[]) => void;
  save: () => Promise<boolean>;
  discard: () => void;
  inspect: () => Promise<void>;
}

export interface BoardProps {
  ref?: Ref<PrepareBoardHandle>;
  mode: BoardMode;
  initialCities?: TouristDestination[]; // optional; defaults to empty
  tripId?: number; // needed to persist board changes and attraction reviews
  onPlanningBlockedChange?: (blocked: boolean) => void;
  onPrepareDraftChange?: (draft: PrepareDraftState) => void;
  initialReviewData?: Record<
    number,
    { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
  >; // pre-populated review ratings/notes/flags from DB
  initialSavedAttractionIds?: number[]; // attraction IDs already saved in DB (skip re-saving)
  visitHistory?: VisitHistoryMap; // visit history per attraction id (other trips)
}
