import {
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  SearchBox,
  mergeClasses
} from "@fluentui/react-components";
import { MoreHorizontal16Regular } from "@fluentui/react-icons";
import { useId, useRef, useState, type ReactElement } from "react";
import type {
  AttractionEntry,
  GetItineraryResponse,
  ItineraryTransferRemovalResponse,
  UnscheduledAttraction
} from "../../clients/manager";
import { readableFactValue, TripAttractionNote } from "./AttractionFactsDialog";
import { useClasses } from "./Itinerary.styles";
import {
  attractionNameId,
  useItineraryCard,
  type DraggedItineraryItem,
  type GroupMemberItem,
  type OpenAttractionFacts
} from "./ItineraryDrag";
import type { GroupMemberChoice } from "./ItineraryGroupActions";
import {
  TransfersToRemoveList,
  transfersForEntryRemoval
} from "./ItineraryTransfer";
import { entryWarningLabels, ItineraryWarning } from "./ItineraryWarning";
import { attractionImportance } from "./UnscheduledAttractions";
import { elapsedMinutes, localClock } from "./itineraryClocks";
import { isAttractionEntry } from "./itineraryEntries";
import { hasVisitDurationFormat } from "./useItineraryScheduling";
import type { ItineraryTimingEditing } from "./useItineraryTimingEdit";
import { usePlanningDraft } from "./useTripPlanningWorkspace";

type Day = GetItineraryResponse["days"][number];
type Candidate =
  | { attraction: UnscheduledAttraction; sourcePosition?: undefined }
  | {
      attraction: AttractionEntry;
      sourcePosition: { day: Day; dayNumber: number; index: number };
    };

function candidatesFor(
  itinerary: GetItineraryResponse,
  host: AttractionEntry,
  search: string
): Candidate[] {
  const candidates: Candidate[] = itinerary.unscheduledAttractions.map(
    (attraction) => ({ attraction })
  );
  itinerary.days.forEach((day, dayIndex) => {
    day.entries.forEach((attraction, index) => {
      if (
        isAttractionEntry(attraction) &&
        attraction.entryId !== host.entryId &&
        attraction.attractionGroup !== "EXCLUDED" &&
        !attraction.groupedAttractions?.length
      ) {
        candidates.push({
          attraction,
          sourcePosition: { day, dayNumber: dayIndex + 1, index }
        });
      }
    });
  });
  const priority = ({ attraction }: Candidate): number => {
    if (attraction.mainAttractionId === host.attractionId) return 0;
    return host.cityId !== undefined && host.cityId === attraction.cityId
      ? 1
      : 2;
  };
  const query = search.trim().toLocaleLowerCase();
  return candidates
    .filter(({ attraction }) =>
      attraction.name.toLocaleLowerCase().includes(query)
    )
    .sort((left, right) => priority(left) - priority(right));
}

interface JoinChoice {
  host: AttractionEntry;
  candidate: Candidate;
  trigger: HTMLButtonElement;
  needsDuration: boolean;
  visitDuration?: string;
  sourceEntryTransfers: ItineraryTransferRemovalResponse[];
  message?: string;
}

interface ItineraryGrouping {
  choice?: JoinChoice;
  pending?: ItineraryTimingEditing["pending"];
  message?: string;
  choose: (
    host: AttractionEntry,
    candidate: Candidate,
    trigger: HTMLButtonElement
  ) => void;
  changeDuration: (value: string) => void;
  submit: () => void;
  cancel: () => void;
  inspect: () => Promise<void>;
}

export function useItineraryGrouping(
  editing: ItineraryTimingEditing,
  onDurationCorrected: (attractionId: number, duration: string) => void,
  onSaved: (message: string) => void
): ItineraryGrouping {
  const [choice, setChoice] = useState<JoinChoice>();
  const pending =
    editing.pending?.entryId === choice?.host.entryId &&
    editing.pending &&
    "action" in editing.pending.edit &&
    editing.pending.edit.action === "join"
      ? editing.pending
      : undefined;
  const rejection = editing.rejections.find(
    ({ entryId, edit }) =>
      entryId === choice?.host.entryId &&
      "action" in edit &&
      edit.action === "join"
  );
  const finish = (previous: JoinChoice): void => {
    setChoice(undefined);
    requestAnimationFrame(() => {
      if (previous.trigger.isConnected) previous.trigger.focus();
      else
        document
          .getElementById(
            attractionNameId(previous.candidate.attraction.attractionId)
          )
          ?.focus();
    });
  };
  const cancel = (): void => {
    if (!choice || pending) return;
    editing.discardRejection(choice.host.entryId, "join");
    finish(choice);
  };
  usePlanningDraft(!!choice, cancel);

  const submit = (next: JoinChoice): void => {
    if (pending) return;
    const { host, candidate, visitDuration, sourceEntryTransfers } = next;
    const { attractionId, name } = candidate.attraction;
    setChoice({ ...next, message: undefined });
    void editing
      .save(
        host.entryId,
        {
          action: "join",
          request: {
            attractionId,
            sourceEntryId: candidate.sourcePosition
              ? candidate.attraction.entryId
              : undefined,
            visitDuration,
            transfersToRemoveWithSourceEntry: sourceEntryTransfers.length
              ? sourceEntryTransfers.map(({ transfer }) => transfer)
              : undefined
          }
        },
        (saved, _recovery, applied) => {
          if (!applied) return;
          if (visitDuration !== undefined) {
            const member = saved.days
              .flatMap((day) => day.entries)
              .filter(isAttractionEntry)
              .find((entry) => entry.entryId === host.entryId)
              ?.groupedAttractions?.find(
                (item) => item.attractionId === attractionId
              );
            if (member?.visitDuration !== undefined) {
              onDurationCorrected(attractionId, member.visitDuration);
            }
          }
          finish(next);
          onSaved(`${name} is now on the entry for ${host.name}.`);
        }
      )
      .then((error) => {
        if (!error) return;
        setChoice({
          ...next,
          needsDuration:
            next.needsDuration ||
            error.schedulingInputs?.requiredInputs?.includes(
              "VISIT_DURATION"
            ) === true,
          sourceEntryTransfers: error.transfersToRemove ?? sourceEntryTransfers,
          message: error.message
        });
      });
  };

  return {
    choice,
    pending,
    message: choice?.message ?? rejection?.message,
    choose: (
      host: AttractionEntry,
      candidate: Candidate,
      trigger: HTMLButtonElement
    ): void => {
      const { sourcePosition } = candidate;
      const next: JoinChoice = {
        host,
        candidate,
        trigger,
        needsDuration:
          !sourcePosition &&
          !hasVisitDurationFormat(candidate.attraction.visitDuration),
        sourceEntryTransfers: sourcePosition
          ? transfersForEntryRemoval(
              sourcePosition.day.entries,
              sourcePosition.index
            )
          : []
      };
      if (sourcePosition || next.needsDuration) setChoice(next);
      else submit(next);
    },
    changeDuration: (visitDuration: string): void => {
      if (!choice || pending) return;
      editing.discardRejection(choice.host.entryId, "join");
      setChoice({ ...choice, visitDuration, message: undefined });
    },
    submit: (): void => {
      if (choice) submit(choice);
    },
    inspect: editing.inspect,
    cancel
  };
}

interface EntryGroupingProps {
  entry: AttractionEntry;
  itinerary: GetItineraryResponse;
  blocked: boolean;
  onChoose: ItineraryGrouping["choose"];
  onReorder: (
    entry: AttractionEntry,
    attractionId: number,
    position: number
  ) => void;
  onChangeMember: (choice: GroupMemberChoice) => void;
  onOpenFacts: OpenAttractionFacts;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
}

function GroupMemberRow({
  item,
  index,
  last,
  canRegroup,
  blocked,
  onReorder,
  onChangeMember,
  onOpenFacts,
  onGrab,
  onRelease
}: Pick<
  EntryGroupingProps,
  | "blocked"
  | "onReorder"
  | "onChangeMember"
  | "onOpenFacts"
  | "onGrab"
  | "onRelease"
> & {
  item: GroupMemberItem;
  index: number;
  last: boolean;
  canRegroup: boolean;
}): ReactElement {
  const classes = useClasses();
  const menuButton = useRef<HTMLButtonElement>(null);
  const { host, member } = item;
  const { Icon, tone, label } = attractionImportance(member);
  const { interaction, nameButton, dragHandle } = useItineraryCard({
    item,
    blocked,
    onGrab,
    onRelease,
    onOpenFacts,
    description: label
  });
  const choose = (action: GroupMemberChoice["action"]): void => {
    onChangeMember({ item, action, trigger: menuButton.current ?? undefined });
  };
  return (
    <li data-itinerary-group-member-index={index} {...interaction}>
      <div className={classes.entryHeader}>
        <div
          className={mergeClasses(
            classes.iconLabel,
            classes.groupedMemberLabel
          )}
        >
          {dragHandle}
          <Icon aria-hidden className={classes[tone]} />
          {nameButton}
          <Caption1>
            {readableFactValue(member.category)} · {member.contributionMinutes}{" "}
            min
          </Caption1>
        </div>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              ref={menuButton}
              appearance="subtle"
              size="small"
              icon={<MoreHorizontal16Regular />}
              aria-label={`Actions for ${member.name}`}
              disabledFocusable={blocked}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                disabled={blocked}
                aria-haspopup="dialog"
                onClick={() => choose("edit-group-member-contribution")}
              >
                Edit contribution...
              </MenuItem>
              <MenuItem
                disabled={blocked || index === 0}
                onClick={() => onReorder(host, member.attractionId, index - 1)}
              >
                Move up
              </MenuItem>
              <MenuItem
                disabled={blocked || last}
                onClick={() => onReorder(host, member.attractionId, index + 1)}
              >
                Move down
              </MenuItem>
              <MenuItem
                disabled={blocked}
                onClick={() => choose("extract-group-member")}
              >
                Extract to day...
              </MenuItem>
              <MenuItem
                disabled={blocked || !canRegroup}
                onClick={() => choose("move-group-member")}
              >
                Move to another entry...
              </MenuItem>
              <MenuItem
                disabled={blocked}
                onClick={() => choose("remove-group-member")}
              >
                Remove from group
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      <TripAttractionNote note={member.tripNote} />
      {member.warnings.map((warning) => (
        <ItineraryWarning key={warning}>
          {entryWarningLabels[warning]}
        </ItineraryWarning>
      ))}
    </li>
  );
}

export function EntryGrouping({
  entry,
  itinerary,
  blocked,
  onChoose,
  onReorder,
  onChangeMember,
  onOpenFacts,
  onGrab,
  onRelease
}: EntryGroupingProps): ReactElement {
  const classes = useClasses();
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const candidates = open ? candidatesFor(itinerary, entry, search) : [];
  const members = entry.groupedAttractions ?? [];
  const canRegroup = itinerary.days.some(({ entries }) =>
    entries.some(({ entryId }) => entryId !== entry.entryId)
  );

  return (
    <div
      className={classes.entryGrouping}
      data-itinerary-group-host={entry.entryId}
    >
      {members.length > 0 && (
        <ul
          className={classes.groupedMembers}
          aria-label={`Grouped attractions on ${entry.name}`}
        >
          {members.map((member, index) => (
            <GroupMemberRow
              key={member.attractionId}
              item={{ kind: "member", host: entry, member }}
              index={index}
              last={index === members.length - 1}
              canRegroup={canRegroup}
              blocked={blocked}
              onReorder={onReorder}
              onChangeMember={onChangeMember}
              onOpenFacts={onOpenFacts}
              onGrab={onGrab}
              onRelease={onRelease}
            />
          ))}
        </ul>
      )}
      <Button
        appearance="subtle"
        size="small"
        aria-label={`On the entry for ${entry.name}`}
        aria-expanded={open}
        aria-controls={open ? searchId : undefined}
        disabledFocusable={blocked}
        onClick={() => setOpen(!open)}
      >
        On the entry
      </Button>
      {open && (
        <div id={searchId} className={classes.groupingPicker}>
          <SearchBox
            aria-label={`Search attractions to group with ${entry.name}`}
            placeholder="Search trip attractions"
            size="small"
            value={search}
            onChange={(_event, { value }) => setSearch(value)}
          />
          {candidates.length ? (
            <ul
              className={classes.groupingCandidates}
              aria-label={`Candidates for ${entry.name}`}
            >
              {candidates.map((candidate) => {
                const { attraction, sourcePosition } = candidate;
                return (
                  <li key={attraction.attractionId}>
                    <Button
                      appearance="subtle"
                      size="small"
                      aria-label={`${sourcePosition ? "Move" : "Add"} ${attraction.name}`}
                      aria-haspopup={sourcePosition ? "dialog" : undefined}
                      disabledFocusable={blocked}
                      onClick={({ currentTarget }) =>
                        onChoose(entry, candidate, currentTarget)
                      }
                    >
                      {sourcePosition
                        ? `Move ${attraction.name}`
                        : attraction.name}
                    </Button>
                    {sourcePosition && (
                      <Caption1>
                        Day {sourcePosition.dayNumber} ·{" "}
                        {localClock(candidate.attraction.timing.start)}
                      </Caption1>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Caption1>No eligible attractions match.</Caption1>
          )}
        </div>
      )}
    </div>
  );
}

export function JoinAttractionDialog({
  grouping
}: {
  grouping: ItineraryGrouping;
}): ReactElement | null {
  const { choice, pending, message, submit, cancel, inspect, changeDuration } =
    grouping;
  const formId = useId();
  if (!choice) return null;
  const {
    candidate,
    host,
    needsDuration,
    sourceEntryTransfers,
    visitDuration
  } = choice;
  const { attraction, sourcePosition } = candidate;
  if (!(sourcePosition || needsDuration || pending?.recovery || message))
    return null;
  const valid = !needsDuration || hasVisitDurationFormat(visitDuration);

  return (
    <Dialog open onOpenChange={(_event, { open }) => !open && cancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {sourcePosition
              ? `Move ${attraction.name} into ${host.name}?`
              : `Add ${attraction.name} to ${host.name}`}
          </DialogTitle>
          <DialogContent>
            {sourcePosition && (
              <>
                <p>
                  {attraction.name} will lose its separate start
                  {candidate.attraction.fixedStart ? " and lock" : ""}
                  {` (Day ${sourcePosition.dayNumber}, ${localClock(candidate.attraction.timing.start)}).`}
                </p>
                <p>
                  Its saved{" "}
                  {elapsedMinutes(
                    candidate.attraction.timing.start,
                    candidate.attraction.timing.end
                  )}{" "}
                  min will be added to the planned length for {host.name}.
                </p>
              </>
            )}
            {sourceEntryTransfers.length > 0 && (
              <>
                <p>These transfers will be removed:</p>
                <TransfersToRemoveList transfers={sourceEntryTransfers} />
              </>
            )}
            {pending?.recovery && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  {pending.recovery === "unconfirmed"
                    ? "The join couldn't be confirmed. Inspect the saved itinerary before trying again."
                    : "The join was saved, but the itinerary couldn't be refreshed."}
                </MessageBarBody>
              </MessageBar>
            )}
            {message && (
              <MessageBar intent="error">
                <MessageBarBody>{message}</MessageBarBody>
              </MessageBar>
            )}
            <form
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                if (valid && !pending) submit();
              }}
            >
              {needsDuration && (
                <Field
                  label="Visit duration"
                  required
                  hint="For example: 5m, 30-45m, or 0m for a brief stop."
                >
                  <Input
                    value={visitDuration ?? ""}
                    maxLength={64}
                    disabled={!!pending}
                    onChange={(_event, { value }) => changeDuration(value)}
                  />
                </Field>
              )}
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} disabled={!!pending}>
              Cancel
            </Button>
            {pending?.recovery ? (
              <Button
                appearance="primary"
                disabled={!!pending.activity}
                onClick={() => void inspect()}
              >
                Inspect saved itinerary
              </Button>
            ) : (
              <Button
                type="submit"
                form={formId}
                appearance="primary"
                disabled={!valid || !!pending}
              >
                {pending
                  ? "Saving group..."
                  : sourcePosition
                    ? "Move into group"
                    : "Add to group"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
