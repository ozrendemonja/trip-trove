import type { UpdateTripRangeRequest } from "../../clients/manager";
import { Trip } from "./domain/Trip.types";

export interface EditTripDetailsProps {
  trip: Trip;
  isOpen: boolean;
  onDismiss: () => void;
  onUpdateClick: () => void;
  unconfirmedDates?: UpdateTripRangeRequest;
  onDateSaveStateChange?: (range?: UpdateTripRangeRequest) => void;
  onSavedDatesInspected?: (trip: Trip) => void;
}
