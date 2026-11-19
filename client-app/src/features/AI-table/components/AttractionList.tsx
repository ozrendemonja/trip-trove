import React from "react";
import AttractionItem from "./AttractionItem";
import "../styles/AttractionList.css";
import type { AttractionListProps } from "./AttractionList.types";

export type { Attraction } from "./AttractionList.types";

const AttractionList: React.FC<AttractionListProps> = ({
  attractions,
  highlightedAttractionIds,
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
  onTogglePermanentlyClosed,
  onDeleteTask,
  readOnly,
  planningDisabled,
  correction,
  renderPlanningFeedback,
  canManageAttractions,
  reviewMode,
  reviewSelection,
  onAttachAttraction,
  onDetachAttraction,
  onToggleWouldVisitAgain,
  visitHistory
}) => {
  return (
    <ul className="attractions">
      {attractions.map((attraction, idx) => (
        <React.Fragment key={attraction.id}>
          {showPlaceholder && insertionIndex === idx && (
            <li
              className="placeholder"
              data-placeholder-height={placeholderHeight}
            />
          )}
          <li
            className="attraction"
            draggable={!planningDisabled}
            onDragStart={onDragStart(attraction.id)}
            data-column={columnId}
            data-id={attraction.id}
            data-just-added={
              highlightedAttractionIds?.has(attraction.id) || undefined
            }
          >
            <AttractionItem
              attraction={attraction}
              locationHint={locationHint}
              columnId={columnId}
              index={idx}
              onUpdateNote={
                !readOnly
                  ? (newNote) => onUpdateNote(columnId, idx, newNote)
                  : undefined
              }
              onUpdateWorkingHours={
                !readOnly && onUpdateWorkingHours
                  ? (newHours: string) =>
                      onUpdateWorkingHours(columnId, idx, newHours)
                  : undefined
              }
              onUpdateVisitTime={
                !readOnly && onUpdateVisitTime
                  ? (newVisit: string) =>
                      onUpdateVisitTime(columnId, idx, newVisit)
                  : undefined
              }
              onToggleMustVisit={
                !readOnly && onToggleMustVisit
                  ? () => onToggleMustVisit(columnId, idx)
                  : undefined
              }
              onTogglePermanentlyClosed={
                onTogglePermanentlyClosed
                  ? (isClosed) =>
                      onTogglePermanentlyClosed(attraction.id, isClosed)
                  : undefined
              }
              onDelete={
                canManageAttractions && onDeleteTask
                  ? () => onDeleteTask(attraction.id)
                  : undefined
              }
              readOnly={readOnly}
              planningDisabled={planningDisabled}
              correctionField={
                correction && correction.attractionId === attraction.id
                  ? correction.field
                  : undefined
              }
              canManageAttractions={canManageAttractions}
              reviewMode={reviewMode}
              reviewData={reviewSelection?.[attraction.id]}
              onAttachAttraction={onAttachAttraction}
              onDetachAttraction={onDetachAttraction}
              onToggleWouldVisitAgain={onToggleWouldVisitAgain}
              visitHistory={visitHistory?.get(attraction.id)}
            />
            {renderPlanningFeedback?.(attraction.id)}
          </li>
        </React.Fragment>
      ))}
      {showPlaceholder && insertionIndex === attractions.length && (
        <li
          className="placeholder"
          data-placeholder-height={placeholderHeight}
        />
      )}
    </ul>
  );
};

export default AttractionList;
