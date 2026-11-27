import {
  Caption1,
  Card,
  Input,
  ToggleButton,
  mergeClasses,
  type InputProps
} from "@fluentui/react-components";
import { LockClosed16Regular, LockOpen16Regular } from "@fluentui/react-icons";
import { useEffect, useId, useState, type ReactElement } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import { TripAttractionCardFacts } from "./AttractionFactsDialog";
import {
  useItineraryAttractionCard,
  type DraggedItineraryItem,
  type OpenAttractionFacts
} from "./ItineraryDrag";
import { useClasses } from "./Itinerary.styles";
import { entryWarningLabels, ItineraryWarning } from "./ItineraryWarning";
import { attractionImportance } from "./UnscheduledAttractions";
import {
  clockOffset,
  clockEditInput,
  elapsedMinutes,
  localClock,
  parseTimingEdit,
  type TimingField
} from "./itineraryClocks";
import {
  editKind,
  type ItineraryTimingEditing
} from "./useItineraryTimingEdit";

type Entry = GetItineraryResponse["days"][number]["entries"][number];
const endDateLabel = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  timeZone: "UTC"
});
const endHint = "For another date, enter YYYY-MM-DD HH:mm.";

export const entryTargetId = (entryId: number): string =>
  `itinerary-entry-${entryId}`;

export function TimelineEntry({
  entry,
  index,
  editing,
  blocked,
  actions,
  grouping,
  onGrab,
  onRelease,
  onOpenFacts
}: {
  entry: Entry;
  index: number;
  editing: ItineraryTimingEditing;
  blocked: boolean;
  actions?: ReactElement;
  grouping?: ReactElement;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
  onOpenFacts: OpenAttractionFacts;
}): ReactElement {
  const classes = useClasses();
  const errorId = useId();
  const lockErrorId = useId();
  const lengthId = useId();
  type ClockInput = { field: TimingField; value: string };
  const [draft, setDraft] = useState<ClockInput & { changed: boolean }>();
  const [endFocused, setEndFocused] = useState(false);
  const [error, setError] = useState<{
    input: HTMLInputElement;
    field: TimingField;
    message: string;
  }>();
  const [lockError, setLockError] = useState<string>();
  const { interaction, nameButton, dragHandle } = useItineraryAttractionCard({
    item: { kind: "entry", entry },
    blocked,
    onGrab,
    onRelease,
    onOpenFacts
  });
  const { Icon, tone, label } = attractionImportance(entry);
  const { start, end, zone, repeatedStart, repeatedEnd } = entry.timing;
  const minutes = elapsedMinutes(start, end);
  const isBriefStop = minutes === 0;
  const endDate = end.slice(0, 10);
  const startOffset = clockOffset(start);
  const endOffset = clockOffset(end);
  const showOffsets = startOffset !== endOffset;
  const proposedClock = (field: TimingField): string | undefined => {
    const text = editing.getClockInput(entry.entryId, field);
    if (text !== undefined) return text;
    const rejected = editing.rejections.find(
      (item) => item.entryId === entry.entryId && editKind(item.edit) === field
    );
    const input = rejected && clockEditInput(rejected.edit);
    if (input?.field === "length") return String(input.minutes);
    if (input?.field === "end" && input.date !== endDate)
      return `${input.date} ${input.clock}`;
    return input?.clock;
  };
  const status =
    editing.pending?.entryId === entry.entryId && editing.pending.activity
      ? editing.pending.activity === "saving"
        ? "Saving entry change..."
        : "Loading saved entry..."
      : editing.feedback?.entryId === entry.entryId
        ? editing.feedback.text
        : undefined;

  useEffect(() => {
    if (!error) return;
    const { input } = error;
    const field = input.parentElement ?? input;
    let startedOutside = false;
    const notePointerDown = (event: PointerEvent): void => {
      startedOutside = !event.composedPath().includes(field);
    };
    const dismiss = (event: MouseEvent): void => {
      if (
        (startedOutside || event.detail === 0) &&
        !event.composedPath().includes(field)
      ) {
        setError(undefined);
      }
      startedOutside = false;
    };
    // Wait for click: removing the message on pointerdown could move the clicked control.
    input.ownerDocument.addEventListener("pointerdown", notePointerDown, true);
    input.ownerDocument.addEventListener("click", dismiss, true);
    return () => {
      input.ownerDocument.removeEventListener(
        "pointerdown",
        notePointerDown,
        true
      );
      input.ownerDocument.removeEventListener("click", dismiss, true);
    };
  }, [error]);

  const inputProps = (
    field: TimingField,
    accepted: string,
    name: string
  ): InputProps => ({
    "aria-label": `${name} for ${entry.name}`,
    "aria-invalid": error?.field === field || undefined,
    "aria-describedby": error?.field === field ? errorId : undefined,
    size: "small",
    appearance: "underline",
    readOnly: blocked,
    value: draft?.field === field ? draft.value : accepted,
    onFocus: () => {
      if (field === "end") setEndFocused(true);
      const proposal = proposedClock(field);
      if (!blocked && proposal !== undefined) {
        setDraft({ field, value: proposal, changed: false });
      }
    },
    onChange: (_event, { value }) => {
      setDraft({ field, value, changed: true });
      editing.setClockInput(entry.entryId, field, value);
    },
    onKeyDown: (event) => {
      if (event.key === "Escape" && draft?.field === field) {
        event.preventDefault();
        setDraft(undefined);
        editing.setClockInput(entry.entryId, field);
        editing.discardRejection(entry.entryId, field);
        setError(undefined);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    onBlur: ({ currentTarget: input }) => {
      if (field === "end") setEndFocused(false);
      if (draft?.field !== field) return;
      setDraft(undefined);
      if (!draft.changed) return;
      const edit = blocked
        ? "Wait for the current planning change before saving this clock."
        : parseTimingEdit(field, draft.value, endDate);
      if (typeof edit === "string") {
        setError({ input, field, message: edit });
        return;
      }
      setError(undefined);
      void editing.save(entry.entryId, edit).then((failure) => {
        if (failure) {
          setError({ input, field, message: failure.message });
        }
      });
    }
  });

  return (
    <li
      className={classes.entry}
      aria-label={entry.name}
      data-itinerary-entry-index={index}
      id={entryTargetId(entry.entryId)}
      tabIndex={-1}
    >
      <div className={classes.clocks}>
        <Input
          {...inputProps("start", localClock(start), "Start clock")}
          className={classes.clockInput}
          title={`${start} (${zone})`}
        />
        {(showOffsets || repeatedStart) && (
          <Caption1>UTC{startOffset === "Z" ? "+00:00" : startOffset}</Caption1>
        )}
        {entry.fixedStart && <Caption1>Fixed start</Caption1>}
        {!isBriefStop && (
          <>
            <Input
              {...inputProps("end", localClock(end), "End clock")}
              className={mergeClasses(classes.clockInput, classes.endClock)}
              title={`${end} (${zone}). ${endHint}`}
              aria-description={`End date: ${endDate}. ${endHint}`}
            />
            {endDate !== start.slice(0, 10) && (
              <Caption1>
                <time dateTime={endDate}>
                  {endDateLabel.format(new Date(endDate))}
                </time>
              </Caption1>
            )}
            {(showOffsets || repeatedEnd) && (
              <Caption1>UTC{endOffset === "Z" ? "+00:00" : endOffset}</Caption1>
            )}
          </>
        )}
      </div>
      <Card
        size="small"
        appearance="outline"
        focusMode="off"
        className={classes.entryCard}
        {...interaction}
      >
        <div className={classes.entryHeader}>
          <div className={classes.iconLabel}>
            {dragHandle}
            <Icon aria-hidden className={classes[tone]} />
            {nameButton}
            <Caption1 className={classes.visuallyHidden}>{label}</Caption1>
          </div>
          <div className={classes.entryActions}>
            <ToggleButton
              size="small"
              appearance="subtle"
              icon={
                entry.fixedStart ? (
                  <LockClosed16Regular />
                ) : (
                  <LockOpen16Regular />
                )
              }
              checked={entry.fixedStart}
              aria-label={`Lock start for ${entry.name}`}
              title={entry.fixedStart ? "Unlock start" : "Lock start"}
              aria-describedby={lockError ? lockErrorId : undefined}
              disabledFocusable={blocked}
              onClick={() => {
                setLockError(undefined);
                void editing
                  .save(entry.entryId, { fixedStart: !entry.fixedStart })
                  .then((failure) => setLockError(failure?.message));
              }}
            />
            {actions}
          </div>
        </div>
        {entry.warnings
          .filter((warning) => warning !== "MISSING_TRANSFER")
          .map((warning) => (
            <ItineraryWarning key={warning}>
              {entryWarningLabels[warning]}
            </ItineraryWarning>
          ))}
        {isBriefStop && <Caption1>Brief stop</Caption1>}
        <label htmlFor={lengthId} className={classes.plannedLength}>
          <Caption1>Planned length</Caption1>
          <Input
            {...inputProps("length", String(minutes), "Planned length")}
            id={lengthId}
            className={classes.clockInput}
            inputMode="numeric"
            contentAfter={<Caption1>min</Caption1>}
          />
        </label>
        {(entry.workingHours || entry.visitDuration || entry.tripNote) && (
          <div className={classes.unscheduledFacts}>
            <TripAttractionCardFacts attraction={entry} />
          </div>
        )}
      </Card>
      {grouping}
      {endFocused && !blocked && (
        <Caption1 className={classes.entryMessage}>{endHint}</Caption1>
      )}
      {error && (
        <Caption1
          id={errorId}
          role="alert"
          className={mergeClasses(classes.entryMessage, classes.entryError)}
        >
          {error.message}
        </Caption1>
      )}
      {lockError && (
        <Caption1
          id={lockErrorId}
          role="alert"
          className={mergeClasses(classes.entryMessage, classes.entryError)}
        >
          {lockError}
        </Caption1>
      )}
      {status && (
        <Caption1 role="status" className={classes.entryMessage}>
          {status}
        </Caption1>
      )}
    </li>
  );
}
