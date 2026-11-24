import {
  Caption1,
  Card,
  Input,
  Text,
  ToggleButton,
  mergeClasses,
  type InputProps
} from "@fluentui/react-components";
import { LockClosed16Regular, LockOpen16Regular } from "@fluentui/react-icons";
import { useEffect, useId, useState, type ReactElement } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import { useClasses } from "./Itinerary.styles";
import { attractionImportance } from "./UnscheduledAttractions";
import {
  clockOffset,
  elapsedMinutes,
  localClock,
  parseTimingEdit,
  type TimingField
} from "./itineraryClocks";
import type { ItineraryTimingEditing } from "./useItineraryTimingEdit";

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
  editing,
  blocked
}: {
  entry: Entry;
  editing: ItineraryTimingEditing;
  blocked: boolean;
}): ReactElement {
  const classes = useClasses();
  const errorId = useId();
  const lockErrorId = useId();
  const lengthId = useId();
  const [draft, setDraft] = useState<{ field: TimingField; value: string }>();
  const [endFocused, setEndFocused] = useState(false);
  const [error, setError] = useState<{
    input: HTMLInputElement;
    field: TimingField;
    message: string;
  }>();
  const [lockError, setLockError] = useState<string>();
  const { Icon, tone, label } = attractionImportance(entry);
  const { start, end, zone } = entry.timing;
  const minutes = elapsedMinutes(start, end);
  const isBriefStop = minutes === 0;
  const endDate = end.slice(0, 10);
  const startOffset = clockOffset(start);
  const endOffset = clockOffset(end);
  const showOffsets = startOffset !== endOffset;
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
    onChange: (_event, { value }) => setDraft({ field, value }),
    onKeyDown: (event) => {
      if (event.key === "Escape" && draft?.field === field) {
        event.preventDefault();
        setDraft(undefined);
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
      if (blocked) return;
      const edit = parseTimingEdit(field, input.value, endDate);
      if (typeof edit === "string") {
        setError({ input, field, message: edit });
        return;
      }
      setError(undefined);
      void editing.save(entry.entryId, edit).then((message) => {
        if (message) setError({ input, field, message });
      });
    }
  });

  return (
    <li
      className={classes.entry}
      aria-label={entry.name}
      id={entryTargetId(entry.entryId)}
      tabIndex={-1}
    >
      <div className={classes.clocks}>
        <Input
          {...inputProps("start", localClock(start), "Start clock")}
          className={classes.clockInput}
          title={`${start} (${zone})`}
        />
        {showOffsets && (
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
              onFocus={() => setEndFocused(true)}
            />
            {endDate !== start.slice(0, 10) && (
              <Caption1>
                <time dateTime={endDate}>
                  {endDateLabel.format(new Date(endDate))}
                </time>
              </Caption1>
            )}
            {showOffsets && (
              <Caption1>UTC{endOffset === "Z" ? "+00:00" : endOffset}</Caption1>
            )}
          </>
        )}
      </div>
      <Card size="small" appearance="outline" className={classes.entryCard}>
        <div className={classes.entryHeader}>
          <div className={classes.iconLabel}>
            <Icon aria-hidden className={classes[tone]} />
            <Text weight="semibold">{entry.name}</Text>
            <Caption1 className={classes.visuallyHidden}>{label}</Caption1>
          </div>
          <ToggleButton
            size="small"
            appearance="subtle"
            icon={
              entry.fixedStart ? <LockClosed16Regular /> : <LockOpen16Regular />
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
                .then(setLockError);
            }}
          />
        </div>
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
      </Card>
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
