import { Trip } from "./domain/Trip.types";

export interface EditTripDetailsProps {
  trip: Trip;
  isOpen: boolean;
  onDismiss: () => void;
  onUpdateClick: () => void;
}
