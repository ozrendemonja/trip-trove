import React, { useState, useRef, useEffect } from 'react';
import '../styles/AttractionItem.css';
import { Rating } from '../../my-trip/domain/Trip.types';
import { Stack, Text, TextField, PrimaryButton, DefaultButton, IconButton, Spinner, SpinnerSize } from '@fluentui/react';
import type { AttractionItemProps } from './AttractionItem.types';
import { useReviewStyles } from './AttractionItem.styles';

const RATING_OPTIONS: { value: Rating; label: string; emoji: string }[] = [
  { value: 'DISLIKED', label: 'Disliked', emoji: '😞' },
  { value: 'BELOW_AVERAGE', label: 'Below Average', emoji: '😕' },
  { value: 'AVERAGE', label: 'Average', emoji: '😐' },
  { value: 'VERY_GOOD', label: 'Very Good', emoji: '😊' },
  { value: 'EXCELLENT', label: 'Excellent', emoji: '🤩' },
];

const AttractionItem: React.FC<AttractionItemProps> = ({ attraction, columnId, locationHint, onUpdateNote, onUpdateWorkingHours, onUpdateVisitTime, onToggleMustVisit, readOnly, inItinerary, onToggleInItinerary, reviewMode, reviewData, onAttachAttraction, onDetachAttraction }) => {
  const review = useReviewStyles();
  const nameClasses = [
    'attraction-name',
    attraction.mustVisit ? 'must-visit' : '',
    attraction.isTraditional ? 'traditional' : '',
    !attraction.stable ? 'unstable' : ''
  ].filter(Boolean).join(' ');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(attraction.note || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [editingHours, setEditingHours] = useState(false);
  const [hoursDraft, setHoursDraft] = useState(attraction.workingHours || '');
  const hoursInputRef = useRef<HTMLInputElement | null>(null);
  const [editingVisit, setEditingVisit] = useState(false);
  const [visitDraft, setVisitDraft] = useState(attraction.VisitTime || '');
  const visitInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (editingHours && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [editingHours]);

  useEffect(() => {
    if (editingVisit && visitInputRef.current) {
      visitInputRef.current.focus();
      visitInputRef.current.select();
    }
  }, [editingVisit]);

  const startAdd = () => { if (readOnly) return; setDraft(''); setEditing(true); };
  const startEdit = () => { if (readOnly) return; setDraft(attraction.note); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(attraction.note); };
  const saveEdit = () => {
    if (onUpdateNote) onUpdateNote(draft.trim());
    setEditing(false);
  };

  const startEditHours = () => { if (readOnly) return; setHoursDraft(attraction.workingHours || ''); setEditingHours(true); };
  const startAddHours = () => { if (readOnly) return; setHoursDraft(''); setEditingHours(true); };
  const cancelEditHours = () => { setEditingHours(false); setHoursDraft(attraction.workingHours || ''); };
  const saveEditHours = () => {
    if (onUpdateWorkingHours) onUpdateWorkingHours(hoursDraft.trim());
    setEditingHours(false);
  };
  const startEditVisit = () => { if (readOnly) return; setVisitDraft(attraction.VisitTime || ''); setEditingVisit(true); };
  const startAddVisit = () => { if (readOnly) return; setVisitDraft(''); setEditingVisit(true); };
  const cancelEditVisit = () => { setEditingVisit(false); setVisitDraft(attraction.VisitTime || ''); };
  const saveEditVisit = () => {
    if (onUpdateVisitTime) onUpdateVisitTime(visitDraft.trim());
    setEditingVisit(false);
  };

  // If readOnly becomes true while editing, exit edit modes.
  useEffect(() => {
    if (readOnly) {
      if (editing) setEditing(false);
      if (editingHours) setEditingHours(false);
      if (editingVisit) setEditingVisit(false);
    }
  }, [readOnly, editing, editingHours, editingVisit]);

  // Review mode state
  const isAttached = !!reviewData;
  const [reviewRating, setReviewRating] = useState<Rating>(reviewData?.rating ?? 'AVERAGE');
  const [reviewNote, setReviewNote] = useState(reviewData?.reviewNote ?? '');
  const [reviewSaving, setReviewSaving] = useState(false);

  // Sync local review form state when reviewData arrives asynchronously (e.g. loaded from DB)
  useEffect(() => {
    if (reviewData) {
      setReviewRating(reviewData.rating);
      setReviewNote(reviewData.reviewNote);
    }
  }, [reviewData]);

  const handleAttach = async () => {
    if (!onAttachAttraction || reviewSaving) return;
    setReviewSaving(true);
    try {
      await onAttachAttraction(attraction.id, reviewRating, reviewNote.trim());
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDetach = async () => {
    if (!onDetachAttraction || reviewSaving) return;
    setReviewSaving(true);
    try {
      await onDetachAttraction(attraction.id);
      setReviewRating('AVERAGE');
      setReviewNote('');
    } finally {
      setReviewSaving(false);
    }
  };

  const containerClasses = [
    'attraction-item',
    inItinerary ? 'in-itinerary' : '',
    isAttached && reviewMode ? 'in-trip' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="attraction-line">
        <button
          type="button"
          className="copy-name-btn"
          onClick={() => {
            const text = attraction.name;
            const isSecondarySpots = columnId?.includes('_secondary');
            const isTopAttractions = columnId?.includes('_top');
            // Top Attractions: mustVisit → ★ Bold, not mustVisit → Bold
            // Secondary Spots: mustVisit → Normal, not mustVisit → Italic
            let htmlContent: string | null = null;
            if (isTopAttractions) {
              htmlContent = attraction.mustVisit ? `<b>★ ${text}</b>` : `<b>${text}</b>`;
            } else if (isSecondarySpots) {
              htmlContent = attraction.mustVisit ? null : `<i>${text}</i>`;
            }
            
            if (htmlContent && navigator.clipboard && navigator.clipboard.write) {
              const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
              const textBlob = new Blob([text], { type: 'text/plain' });
              navigator.clipboard.write([
                new ClipboardItem({
                  'text/html': htmlBlob,
                  'text/plain': textBlob
                })
              ]).catch(() => {
                // Fallback to plain text
                navigator.clipboard.writeText(text).catch(() => {});
              });
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).catch(() => {});
            } else {
              const ta = document.createElement('textarea');
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              try { document.execCommand('copy'); } catch {}
              document.body.removeChild(ta);
            }
          }}
          title="Copy attraction name"
          aria-label="Copy attraction name"
        >
          📋
        </button>
        {(() => {
          const query = locationHint ? `${attraction.name} ${locationHint}` : attraction.name;
          const href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          return (
            <a
              className={nameClasses}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="Search on Google"
            >
              {attraction.name}{attraction.isCountrywide ? ' 🏳️' : ''}
            </a>
          );
        })()}
        {onToggleMustVisit && !readOnly && (
          <button
            type="button"
            className="mustvisit-toggle-btn"
            onClick={onToggleMustVisit}
            title={attraction.mustVisit ? 'Unmark must visit' : 'Mark must visit'}
          >
            {attraction.mustVisit ? '★' : '☆'}
          </button>
        )}
        {readOnly && onToggleInItinerary && (
          <label className="itinerary-checkbox" title="Mark as already planned in itinerary">
            <input
              type="checkbox"
              checked={!!inItinerary}
              onChange={onToggleInItinerary}
            />
            <span className="itinerary-checkbox-box">{inItinerary ? '✓' : ''}</span>
          </label>
        )}
      </div>
      {(attraction.address || attraction.category) && (
        <div className="attraction-address-line">
          <span className="attraction-address-text">{attraction.address}</span>
          {attraction.category && (
            <span className="attraction-category-text">{attraction.category}</span>
          )}
        </div>
      )}
      {(attraction.workingHours || attraction.VisitTime || (!readOnly && (editingHours || editingVisit || onUpdateWorkingHours || onUpdateVisitTime))) && (
        <div className="attraction-hours">
          {!editingHours && !editingVisit && (
            <>
              {attraction.workingHours && (
                <span className="hours-segment">
                  <span className="hours-text">{attraction.workingHours}</span>
                  {!readOnly && onUpdateWorkingHours && (
                    <button type="button" className="hours-edit-btn" onClick={startEditHours} title="Edit working hours">✎</button>
                  )}
                  {!readOnly && !attraction.workingHours && onUpdateWorkingHours && (
                    <button type="button" className="hours-add-btn" onClick={startAddHours} title="Add working hours">+ hours</button>
                  )}
                </span>
              )}
              {!attraction.workingHours && !readOnly && onUpdateWorkingHours && (
                <button type="button" className="hours-add-btn" onClick={startAddHours} title="Add working hours">+ hours</button>
              )}
              {attraction.workingHours && attraction.VisitTime && (
                <span className="hours-separator">|</span>
              )}
              {attraction.VisitTime && (
                <span className="visit-time-segment">
                  <span className="visit-time-text">{attraction.VisitTime}</span>
                  {!readOnly && onUpdateVisitTime && (
                    <button type="button" className="visit-edit-btn" onClick={startEditVisit} title="Edit visit time">✎</button>
                  )}
                </span>
              )}
              {!attraction.VisitTime && !readOnly && onUpdateVisitTime && (
                <button type="button" className="visit-add-btn" onClick={startAddVisit} title="Add visit time">+ visit</button>
              )}
            </>
          )}
          {!readOnly && editingHours && (
            <div className="hours-edit-wrap">
              <input
                ref={hoursInputRef}
                className="hours-input"
                value={hoursDraft}
                onChange={(e) => setHoursDraft(e.target.value)}
                placeholder="Working hours"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEditHours(); } }}
              />
              <div className="hours-edit-actions">
                <button type="button" onClick={saveEditHours} className="hours-save-btn">Save</button>
                <button type="button" onClick={cancelEditHours} className="hours-cancel-btn">Cancel</button>
              </div>
            </div>
          )}
          {!readOnly && editingVisit && (
            <div className="visit-edit-wrap">
              <input
                ref={visitInputRef}
                className="visit-input"
                value={visitDraft}
                onChange={(e) => setVisitDraft(e.target.value)}
                placeholder="Visit time"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEditVisit(); } }}
              />
              <div className="visit-edit-actions">
                <button type="button" onClick={saveEditVisit} className="visit-save-btn">Save</button>
                <button type="button" onClick={cancelEditVisit} className="visit-cancel-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      {(attraction.note || attraction.infoFrom || editing || attraction.optimalVisitPeriod || (!readOnly && onUpdateNote)) && (
        <div>
          {(editing || attraction.note || attraction.optimalVisitPeriod) && (
            <div className={`sticky-note${reviewMode ? ' review-muted' : ''}`}>
              {!editing && (
                <>
                  {attraction.note}
                  {attraction.optimalVisitPeriod && (
                    <div>Optimal visit time: {attraction.optimalVisitPeriod}</div>
                  )}
                  {!readOnly && onUpdateNote && (
                    attraction.note ? (
                      <button type="button" className="note-edit-btn" onClick={startEdit} title="Edit note">✎</button>
                    ) : (
                      <button type="button" className="note-add-btn" onClick={startAdd} title="Add note">+</button>
                    )
                  )}
                </>
              )}
              {editing && (
                <div className="note-edit-wrap">
                  <textarea
                    className="note-textarea"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    ref={textareaRef}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); } }}
                  />
                  <div className="note-edit-actions">
                    <button type="button" onClick={saveEdit} className="note-save-btn">Save</button>
                    <button type="button" onClick={cancelEdit} className="note-cancel-btn">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!readOnly && !editing && !attraction.note && !attraction.optimalVisitPeriod && onUpdateNote && (
            <button type="button" className="note-add-inline-btn" onClick={startAdd} title="Add note">+ Add note</button>
          )}
          {attraction.infoFrom && (
            <div className="attraction-info-from">Source: {attraction.infoFrom}</div>
          )}
        </div>
      )}
      {reviewMode && (
        <div className={review.reviewSection}>
          {isAttached ? (
            <div className={review.reviewAttached}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Stack.Item grow>
                  <Stack tokens={{ childrenGap: 2 }}>
                    <Text styles={review.attachedRating}>
                      {RATING_OPTIONS.find(r => r.value === reviewData.rating)?.emoji}{' '}
                      {RATING_OPTIONS.find(r => r.value === reviewData.rating)?.label}
                    </Text>
                    {reviewData.reviewNote && <Text styles={review.attachedNote}>{reviewData.reviewNote}</Text>}
                  </Stack>
                </Stack.Item>
                <IconButton
                  iconProps={{ iconName: 'Cancel' }}
                  styles={review.removeBtn}
                  onClick={handleDetach}
                  disabled={reviewSaving}
                  title="Remove from trip"
                  ariaLabel="Remove from trip"
                />
              </Stack>
            </div>
          ) : (
            <div className={review.reviewForm}>
              <Stack tokens={{ childrenGap: 6 }}>
                <Stack horizontal tokens={{ childrenGap: 4 }}>
                  {RATING_OPTIONS.map(opt => (
                    <DefaultButton
                      key={opt.value}
                      styles={review.ratingBtn(reviewRating === opt.value)}
                      onClick={() => setReviewRating(opt.value)}
                      title={opt.label}
                      ariaLabel={opt.label}
                    >
                      {opt.emoji}
                    </DefaultButton>
                  ))}
                </Stack>
                <TextField
                  styles={review.noteInput}
                  value={reviewNote}
                  onChange={(_e, newValue) => setReviewNote((newValue ?? '').slice(0, 512))}
                  placeholder="Trip note (optional, max 512 chars)"
                  multiline
                  rows={2}
                  maxLength={512}
                  borderless
                />
                <PrimaryButton
                  styles={review.addBtn}
                  onClick={handleAttach}
                  disabled={reviewSaving}
                >
                  {reviewSaving ? <Spinner size={SpinnerSize.xSmall} /> : '+ Add to trip'}
                </PrimaryButton>
              </Stack>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttractionItem;
