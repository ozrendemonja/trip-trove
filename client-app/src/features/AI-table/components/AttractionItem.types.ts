import { Rating } from "../../my-trip/domain/Trip.types";
import { Attraction } from "./AttractionList.types";

export interface AttractionItemProps {
  attraction: Attraction;
  placeholderHeight?: number;
  columnId?: string; // not used directly but reserved
  index?: number; // not used directly but reserved
  locationHint?: string; // city name or region name for search
  onUpdateNote?: (newNote: string) => void;
  onUpdateWorkingHours?: (newHours: string) => void;
  onUpdateVisitTime?: (newVisit: string) => void;
  onToggleMustVisit?: () => void;
  readOnly?: boolean;
  inItinerary?: boolean;
  onToggleInItinerary?: () => void;
  reviewMode?: boolean;
  reviewData?: { rating: Rating; reviewNote: string };
  onAttachAttraction?: (attractionId: number, ratingValue: Rating, reviewNote: string) => Promise<void>;
  onDetachAttraction?: (attractionId: number) => Promise<void>;
}
