import { Rating } from "../../my-trip/domain/Trip.types";

export interface Attraction {
  id: number; // internal identifier, not displayed
  mustVisit: boolean;
  stable: boolean;
  isTraditional: boolean;
  isCountrywide: boolean; // new flag
  inItinerary?: boolean;
  name: string;
  address: string;
  category: string;
  infoFrom: string;
  note: string;
  optimalVisitPeriod?: string;
  workingHours?: string;
  VisitTime: string;
}

export interface AttractionListProps {
  attractions: Attraction[];
  showPlaceholder: boolean;
  insertionIndex: number;
  placeholderHeight?: number;
  onDragStart: (taskIndex: number) => (e: React.DragEvent) => void;
  columnId: string;
  locationHint?: string; // city name or region name
  onUpdateNote: (columnId: string, index: number, newNote: string) => void;
  onUpdateWorkingHours?: (columnId: string, index: number, newHours: string) => void;
  onUpdateVisitTime?: (columnId: string, index: number, newVisit: string) => void;
  onToggleMustVisit?: (columnId: string, index: number) => void;
  updateById?: (attractionId: number, partial: Partial<Attraction>) => void; // optional helper
  upsertAttractions?: (columnId: string, newAttractions: Attraction[]) => void; // optional batch merge
  readOnly?: boolean;
  isInItinerary?: (attractionId: number) => boolean;
  onToggleItinerary?: (attractionId: number) => void;
  reviewMode?: boolean;
  reviewSelection?: Record<number, { rating: Rating; reviewNote: string }>;
  onAttachAttraction?: (attractionId: number, ratingValue: Rating, reviewNote: string) => Promise<void>;
  onDetachAttraction?: (attractionId: number) => Promise<void>;
}
