import React from 'react';
import AttractionItem from './AttractionItem';
import '../styles/AttractionList.css';
import type { Attraction, AttractionListProps } from './AttractionList.types';

export type { Attraction } from './AttractionList.types';

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
  onToggleItinerary,
  reviewMode,
  reviewSelection,
  onAttachAttraction,
  onDetachAttraction
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
              reviewMode={reviewMode}
              reviewData={reviewSelection?.[attraction.id]}
              onAttachAttraction={onAttachAttraction}
              onDetachAttraction={onDetachAttraction}
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
