import { Rating } from "../../my-trip/domain/Trip.types";
import type { VisitHistoryMap } from "../utils/Mapper";
import type { ReactNode } from "react";

export type PlanningTextField = "note" | "working-hours" | "visit-time";

export interface Attraction {
  id: number; // internal identifier, not displayed
  mustVisit: boolean;
  stable: boolean;
  isTraditional: boolean;
  isCountrywide: boolean; // new flag
  permanentlyClosedAt?: string;
  name: string;
  address: string;
  category: string;
  infoFrom: string;
  catalogueTip?: string;
  note: string;
  optimalVisitPeriod?: string;
  workingHours?: string;
  VisitTime: string;
}

export interface AttractionListProps {
  attractions: Attraction[];
  highlightedAttractionIds?: ReadonlySet<number>;
  showPlaceholder: boolean;
  insertionIndex: number;
  placeholderHeight?: number;
  onDragStart: (attractionId: number) => (e: React.DragEvent) => void;
  columnId: string;
  locationHint?: string; // city name or region name
  onUpdateNote: (columnId: string, index: number, newNote: string) => void;
  onUpdateWorkingHours?: (
    columnId: string,
    index: number,
    newHours: string
  ) => void;
  onUpdateVisitTime?: (
    columnId: string,
    index: number,
    newVisit: string
  ) => void;
  onToggleMustVisit?: (columnId: string, index: number) => void;
  onTogglePermanentlyClosed?: (attractionId: number, isClosed: boolean) => void;
  onDeleteTask?: (attractionId: number) => void;
  updateById?: (attractionId: number, partial: Partial<Attraction>) => void; // optional helper
  upsertAttractions?: (columnId: string, newAttractions: Attraction[]) => void; // optional batch merge
  readOnly?: boolean;
  planningDisabled?: boolean;
  correction?: {
    attractionId: number;
    field: PlanningTextField;
    value: string;
  };
  renderScheduledStatus?: (attractionId: number) => ReactNode;
  renderPlanningFeedback?: (attractionId: number) => ReactNode;
  // Whether add/remove/move of attraction cards is allowed even when per-item
  // detail edits are disabled (true in edit and prepare modes).
  canManageAttractions?: boolean;
  reviewMode?: boolean;
  reviewSelection?: Record<
    number,
    { rating: Rating; reviewNote: string; wouldVisitAgain: boolean }
  >;
  onAttachAttraction?: (
    attractionId: number,
    ratingValue: Rating,
    reviewNote: string
  ) => Promise<void>;
  onDetachAttraction?: (attractionId: number) => Promise<void>;
  onToggleWouldVisitAgain?: (attractionId: number) => Promise<void>;
  visitHistory?: VisitHistoryMap;
}
