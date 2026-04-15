import { Trip } from "./domain/Trip.types";

export interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}
