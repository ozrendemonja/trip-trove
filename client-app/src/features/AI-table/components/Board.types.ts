import type { Attraction } from "./AttractionList.types";

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
}
