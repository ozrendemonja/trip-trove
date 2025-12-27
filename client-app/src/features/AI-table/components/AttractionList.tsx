import React from 'react';
import AttractionItem from './AttractionItem';
import '../styles/AttractionList.css';

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

interface AttractionListProps {
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
}

const AttractionList: React.FC<AttractionListProps> = ({
  attractions,
  showPlaceholder,
  insertionIndex,
  placeholderHeight,
  onDragStart,
  columnId,
  locationHint,
  onUpdateNote,
  onUpdateWorkingHours,
  onUpdateVisitTime,
  onToggleMustVisit,
  readOnly,
  isInItinerary,
  onToggleItinerary
}) => {
  return (
    <ul className="attractions">
      {attractions.map((attraction, idx) => (
        <React.Fragment key={attraction.id}>
          {showPlaceholder && insertionIndex === idx && (
            <li className="placeholder" style={{ height: placeholderHeight }} />
          )}
          <li
            className="attraction"
            draggable
            onDragStart={onDragStart(idx)}
            data-column={columnId}
            data-id={attraction.id}
          >
            <AttractionItem
              attraction={attraction}
              locationHint={locationHint}
              columnId={columnId}
              index={idx}
              onUpdateNote={!readOnly ? (newNote) => onUpdateNote(columnId, idx, newNote) : undefined}
              onUpdateWorkingHours={!readOnly && onUpdateWorkingHours ? (newHours: string) => onUpdateWorkingHours(columnId, idx, newHours) : undefined}
              onUpdateVisitTime={!readOnly && onUpdateVisitTime ? (newVisit: string) => onUpdateVisitTime(columnId, idx, newVisit) : undefined}
              onToggleMustVisit={!readOnly && onToggleMustVisit ? () => onToggleMustVisit(columnId, idx) : undefined}
              inItinerary={isInItinerary ? isInItinerary(attraction.id) : false}
              onToggleInItinerary={onToggleItinerary ? () => onToggleItinerary(attraction.id) : undefined}
              readOnly={readOnly}
            />
          </li>
        </React.Fragment>
      ))}
      {showPlaceholder && insertionIndex === attractions.length && (
        <li className="placeholder" style={{ height: placeholderHeight }} />
      )}
    </ul>
  );
};

export default AttractionList;
