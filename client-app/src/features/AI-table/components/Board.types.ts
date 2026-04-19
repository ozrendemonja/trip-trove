import type { Attraction } from "./AttractionList.types";
import type { Rating } from "../../my-trip/domain/Trip.types";

export interface Column {
  id: string;
  title: string;
  tasks: Attraction[];
}

export interface TouristDestination {
  name: string;
  columns: Column[];
}

export interface BoardProps {
  initialCities?: TouristDestination[]; // optional; defaults to empty
  onCitiesLoaded?: (cities: TouristDestination[]) => void; // callback when cities are loaded from file
  tripId?: number; // needed for review mode (attach/detach attractions)
  initialReviewData?: Record<number, { rating: Rating; reviewNote: string }>; // pre-populated review ratings/notes from DB
  initialSavedAttractionIds?: number[]; // attraction IDs already saved in DB (skip re-saving)
}
