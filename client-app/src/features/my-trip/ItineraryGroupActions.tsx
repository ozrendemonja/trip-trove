import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select
} from "@fluentui/react-components";
import { useId, useState, type ReactElement } from "react";
import type {
  GetItineraryResponse,
  ItineraryTransferRemovalResponse
} from "../../clients/manager";
import { useClasses } from "./Itinerary.styles";
import type { GroupedAttraction, GroupMemberItem } from "./ItineraryDrag";
import {
  transferBetweenEntries,
  TransfersToRemoveList
} from "./ItineraryTransfer";
import type { GroupMemberEdit } from "./infra/ItinerarySchedulingApi";
import { isLocalClock, readPlannedMinutes } from "./itineraryClocks";
import { isAttractionEntry } from "./itineraryEntries";
import {
  editKind,
  type ItineraryTimingEditing
} from "./useItineraryTimingEdit";
import { usePlanningDraft } from "./useTripPlanningWorkspace";

type Day = GetItineraryResponse["days"][number];

export type GroupMemberChoice = {
  item: GroupMemberItem;
  trigger?: HTMLButtonElement;
} & (
  | { action: "extract-group-member"; date?: string; beforeEntryId?: number }
  | { action: "move-group-member"; destinationEntryId?: number }
  | { action: "edit-group-member-contribution" }
  | { action: "remove-group-member" }
);

function returnsToUnscheduled(member: GroupedAttraction): boolean {
  return (
    member.attractionGroup !== "EXCLUDED" &&
    !member.warnings.includes("PERMANENTLY_CLOSED")
  );
}

export function GroupDissolutionDetails({
  members
}: {
  members: readonly GroupedAttraction[];
}): ReactElement {
  return (
    <>
      <p>
        The group will dissolve. These attractions and their trip notes stay on
        the trip:
      </p>
      <ul>
        {members.map((member) => (
          <li key={member.attractionId}>
            {member.name}:{" "}
            {returnsToUnscheduled(member)
              ? "returns to Unscheduled attractions"
              : "does not return to Unscheduled attractions"}
          </li>
        ))}
      </ul>
    </>
  );
}

const verbs = {
  "edit-group-member-contribution": "Edit contribution for",
  "extract-group-member": "Extract",
  "move-group-member": "Move",
  "remove-group-member": "Remove"
} as const;

export function GroupMemberDialog({
  choice,
  days,
  formatDate,
  editing,
  blocked,
  onClose,
  onSaved
}: {
  choice: GroupMemberChoice;
  days: readonly Day[];
  formatDate: (date: string) => string;
  editing: ItineraryTimingEditing;
  blocked: boolean;
  onClose: () => void;
  onSaved: (saved: GetItineraryResponse) => void;
}): ReactElement {
  const classes = useClasses();
  const formId = useId();
  const {
    action,
    item: { host, member }
  } = choice;
  const { entryId } = host;
  const { attractionId, contributionMinutes, name } = member;
  const editingContribution = action === "edit-group-member-contribution";
  const [minutesInput, setMinutesInput] = useState(String(contributionMinutes));
  const extracting = action === "extract-group-member";
  const moving = action === "move-group-member";
  const [date, setDate] = useState(
    (extracting && choice.date) || host.timing.start.slice(0, 10)
  );
  const [beforeEntryId, setBeforeEntryId] = useState(
    extracting ? choice.beforeEntryId : undefined
  );
  const [startTime, setStartTime] = useState("");
  const [destinationEntryId, setDestinationEntryId] = useState(
    moving ? choice.destinationEntryId : undefined
  );
  const [reviewedTransfers, setReviewedTransfers] =
    useState<ItineraryTransferRemovalResponse[]>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const day = days.find((item) => item.date === date);
  const index =
    beforeEntryId === undefined
      ? day?.entries.length
      : day?.entries.findIndex((entry) => entry.entryId === beforeEntryId);
  const gap =
    day && index !== undefined
      ? transferBetweenEntries(day.entries[index - 1], day.entries[index])
      : undefined;
  const transfers = reviewedTransfers ?? (gap ? [gap] : []);
  const destinations = moving
    ? days.flatMap((item) =>
        item.entries
          .filter(isAttractionEntry)
          .filter((entry) => entry.entryId !== entryId)
          .map((entry) => ({ entry, date: item.date }))
      )
    : [];
  const destination = destinations.find(
    ({ entry }) => entry.entryId === destinationEntryId
  );
  const needsStart = extracting && day?.entries.length === 0;
  const pending = editing.pending;
  const rejection = editing.rejections.find(
    (item) => item.entryId === entryId && editKind(item.edit) === action
  );
  const message = rejection?.message ?? errorMessage;
  const close = (): void => {
    if (pending) return;
    editing.discardRejection(entryId, action);
    onClose();
  };
  usePlanningDraft(true, close);

  const changeProposal = (): void => {
    editing.discardRejection(entryId, action);
    setErrorMessage(undefined);
    setReviewedTransfers(undefined);
  };
  const clock = startTime.trim();
  const minutes = readPlannedMinutes(minutesInput, 0);
  const valid = editingContribution
    ? minutes !== undefined
    : extracting
      ? day &&
        index !== undefined &&
        index >= 0 &&
        (!needsStart || isLocalClock(clock))
      : !moving || !!destination;
  const submit = (): void => {
    if (!valid || blocked || pending) return;
    let edit: GroupMemberEdit;
    if (editingContribution && minutes !== undefined) {
      edit = {
        action,
        attractionId,
        request: { contributionMinutes: minutes }
      };
    } else if (extracting) {
      edit = {
        action,
        attractionId,
        request: {
          date,
          beforeEntryId,
          startTime: needsStart ? clock : undefined,
          transfersToRemoveAtInsertionPoint: transfers.length
            ? transfers.map(({ transfer }) => transfer)
            : undefined
        }
      };
    } else if (moving && destination) {
      edit = {
        action,
        attractionId,
        destinationEntryId: destination.entry.entryId
      };
    } else if (action === "remove-group-member") {
      edit = { action, attractionId };
    } else {
      return;
    }
    setErrorMessage(undefined);
    void editing
      .save(entryId, edit, (saved, _outcome, applied) => {
        if (applied) onSaved(saved);
      })
      .then((error) => {
        if (!error) return;
        setReviewedTransfers(error.transfersToRemove ?? reviewedTransfers);
        setErrorMessage(error.message);
      });
  };

  return (
    <Dialog open onOpenChange={(_event, { open }) => !open && close()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {verbs[action]} {name}
            {extracting || editingContribution ? "" : "?"}
          </DialogTitle>
          <DialogContent>
            {editingContribution ? (
              <p>
                The host keeps its own allocation, start and lock. Correct the
                source separately in the attraction&apos;s facts.
              </p>
            ) : (
              <p>
                {host.name}&apos;s planned length will be reduced by{" "}
                {contributionMinutes} min. {name}&apos;s trip note stays with
                the attraction.
              </p>
            )}
            {extracting && (
              <p>
                The new entry keeps {contributionMinutes} min and starts
                unlocked.
              </p>
            )}
            {moving && destination && (
              <p>
                {destination.entry.name}&apos;s planned length will increase by{" "}
                {contributionMinutes} min.
              </p>
            )}
            {action === "remove-group-member" && (
              <p>
                {returnsToUnscheduled(member)
                  ? "The attraction will return to Unscheduled attractions."
                  : "The attraction will not return to Unscheduled attractions."}
              </p>
            )}
            <form
              id={formId}
              className={classes.positionFields}
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              {editingContribution && (
                <Field
                  label="Contribution (minutes)"
                  required
                  hint={`Current visit duration: ${member.visitDuration || "not recorded"}`}
                  validationState={minutes === undefined ? "error" : undefined}
                  validationMessage={
                    minutes === undefined
                      ? "Enter a non-negative whole contribution in minutes."
                      : undefined
                  }
                >
                  <Input
                    inputMode="numeric"
                    value={minutesInput}
                    disabled={!!pending}
                    onChange={(_event, { value }) => {
                      setMinutesInput(value);
                      changeProposal();
                    }}
                  />
                </Field>
              )}
              {extracting && (
                <>
                  <Field label="Day">
                    <Select
                      value={date}
                      disabled={!!pending}
                      onChange={(_event, { value }) => {
                        setDate(value);
                        setBeforeEntryId(undefined);
                        setStartTime("");
                        changeProposal();
                      }}
                    >
                      {days.map((item) => (
                        <option key={item.date} value={item.date}>
                          {formatDate(item.date)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {!needsStart && (
                    <Field label="Position">
                      <Select
                        value={beforeEntryId ?? ""}
                        disabled={!!pending}
                        onChange={(_event, { value }) => {
                          setBeforeEntryId(value ? Number(value) : undefined);
                          changeProposal();
                        }}
                      >
                        <option value="">End of day</option>
                        {day?.entries.map((entry) => (
                          <option key={entry.entryId} value={entry.entryId}>
                            Before {entry.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                  {needsStart && (
                    <Field
                      label="Start clock"
                      required
                      hint="Enter a local clock in HH:mm format."
                    >
                      <Input
                        value={startTime}
                        disabled={!!pending}
                        maxLength={8}
                        onChange={(_event, { value }) => {
                          setStartTime(value);
                          changeProposal();
                        }}
                      />
                    </Field>
                  )}
                </>
              )}
              {moving && (
                <Field label="Destination entry" required>
                  <Select
                    value={destinationEntryId ?? ""}
                    disabled={!!pending}
                    onChange={(_event, { value }) => {
                      setDestinationEntryId(value ? Number(value) : undefined);
                      changeProposal();
                    }}
                  >
                    <option value="">Choose an entry</option>
                    {destinations.map(({ entry, date: entryDate }) => (
                      <option key={entry.entryId} value={entry.entryId}>
                        {entry.name} ({formatDate(entryDate)})
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </form>
            {extracting && transfers.length > 0 && (
              <>
                <p>These transfers will be removed:</p>
                <TransfersToRemoveList transfers={transfers} />
              </>
            )}
            {message && (
              <MessageBar intent="error">
                <MessageBarBody>{message}</MessageBarBody>
              </MessageBar>
            )}
            {pending?.recovery && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  {pending.recovery === "unconfirmed"
                    ? "The save couldn't be confirmed. Inspect the saved itinerary before trying again."
                    : "The change was saved, but the itinerary couldn't be refreshed."}
                </MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={close} disabled={!!pending}>
              Cancel
            </Button>
            {pending?.recovery ? (
              <Button
                appearance="primary"
                disabled={!!pending.activity}
                onClick={() => void editing.inspect()}
              >
                Inspect saved itinerary
              </Button>
            ) : (
              <Button
                type="submit"
                form={formId}
                appearance="primary"
                disabled={!valid || blocked || !!pending}
              >
                {pending
                  ? "Saving group..."
                  : editingContribution
                    ? "Save contribution"
                    : `${verbs[action]} attraction`}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
