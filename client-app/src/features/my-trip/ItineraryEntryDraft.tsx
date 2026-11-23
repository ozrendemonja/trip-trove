import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text
} from "@fluentui/react-components";
import { useEffect, useId, useRef, type ReactElement } from "react";
import { useClasses } from "./Itinerary.styles";
import {
  type EntryDraft,
  hasVisitDurationFormat,
  type ItineraryScheduling
} from "./useItineraryScheduling";

const timeZones = ["UTC", ...Intl.supportedValuesOf("timeZone")];

export const ItineraryEntryDraft = ({
  draft,
  scheduling,
  blocked
}: {
  draft: EntryDraft;
  scheduling: ItineraryScheduling;
  blocked: boolean;
}): ReactElement => {
  const classes = useClasses();
  const headingId = useId();
  const zoneListId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { intent, inputs, activity, unconfirmed, message } = draft;
  const disabled = !!activity || !!unconfirmed || blocked;
  const durationRequired = inputs.includes("VISIT_DURATION");
  const zoneRequired = inputs.includes("TIME_ZONE");
  const hasOtherInputs = durationRequired || zoneRequired;
  const valid =
    !!intent.startTime &&
    (!durationRequired || hasVisitDurationFormat(intent.visitDuration)) &&
    (!zoneRequired || !!intent.timeZone?.trim());

  useEffect(() => {
    const form = formRef.current;
    if (!disabled && form && !form.contains(form.ownerDocument.activeElement)) {
      form.querySelector<HTMLElement>("input, button:not([disabled])")?.focus();
    }
  }, [disabled]);

  return (
    <form
      ref={formRef}
      className={classes.entryDraft}
      aria-labelledby={headingId}
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && valid) void scheduling.submit();
      }}
    >
      <Text id={headingId} weight="semibold">
        Add {draft.attraction.name}
      </Text>
      <Field
        label="Start clock"
        hint={
          hasOtherInputs
            ? undefined
            : "Leave this field to save, or press Esc to cancel."
        }
      >
        <Input
          type="time"
          step={intent.startTime?.length === 8 ? 1 : undefined}
          value={intent.startTime ?? ""}
          disabled={disabled}
          onChange={(_event, { value }) =>
            scheduling.update("startTime", value)
          }
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              scheduling.cancel();
            }
          }}
          onBlur={({ relatedTarget }) => {
            if (
              !disabled &&
              valid &&
              !message &&
              relatedTarget !== cancelRef.current &&
              !(hasOtherInputs && formRef.current?.contains(relatedTarget))
            ) {
              void scheduling.submit();
            }
          }}
        />
      </Field>
      {durationRequired && (
        <Field
          label="Visit duration"
          hint="Use hours and minutes, e.g. 45m or 1h-2h. Use 0m for a brief stop."
        >
          <Input
            value={intent.visitDuration ?? ""}
            maxLength={64}
            disabled={disabled}
            onChange={(_event, { value }) =>
              scheduling.update("visitDuration", value)
            }
          />
        </Field>
      )}
      {zoneRequired && (
        <Field
          label="Itinerary time zone"
          hint="Choose a named zone for the itinerary."
        >
          <Input
            list={zoneListId}
            placeholder="Europe/Belgrade"
            value={intent.timeZone ?? ""}
            maxLength={255}
            disabled={disabled}
            onChange={(_event, { value }) =>
              scheduling.update("timeZone", value)
            }
          />
          <datalist id={zoneListId}>
            {timeZones.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </Field>
      )}
      {message && (
        <MessageBar intent={unconfirmed ? "warning" : "error"}>
          <MessageBarBody>{message}</MessageBarBody>
        </MessageBar>
      )}
      {activity ? (
        <Spinner
          size="tiny"
          label={
            activity === "saving"
              ? "Saving to the itinerary"
              : "Loading saved itinerary"
          }
        />
      ) : (
        <div className={classes.draftActions}>
          {unconfirmed ? (
            <Button
              appearance="primary"
              size="small"
              disabled={blocked}
              onClick={() => void scheduling.inspect()}
            >
              Inspect saved itinerary
            </Button>
          ) : (
            <>
              <Button
                appearance="primary"
                size="small"
                type="submit"
                disabled={disabled || !valid}
              >
                Add to day
              </Button>
              <Button
                ref={cancelRef}
                appearance="subtle"
                size="small"
                type="button"
                onPointerDown={(event) => event.preventDefault()}
                onClick={scheduling.cancel}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </form>
  );
};
