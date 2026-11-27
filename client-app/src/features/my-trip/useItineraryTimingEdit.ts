import { useRef, useState } from "react";
import type {
  GetItineraryResponse,
  ItineraryItemFields,
  TypedItineraryEntryResponse
} from "../../clients/manager";
import {
  EntryEditError,
  saveEntryEdit,
  saveItemAddition,
  type AddItemEdit,
  type EntryEdit
} from "./infra/ItinerarySchedulingApi";
import { isAttractionEntry, type ItineraryEntry } from "./itineraryEntries";
import type { PlanningWorkspace } from "./useTripPlanningWorkspace";
import {
  clockEditInput,
  clockOffset,
  elapsedMinutes,
  localClock,
  type TimingField
} from "./itineraryClocks";

type ReloadOutcome = "unconfirmed" | "refresh";

type EditTarget =
  | { entryId: number; edit: EntryEdit }
  | { entryId?: undefined; edit: AddItemEdit };

type PendingEdit = EditTarget & {
  tripId: number;
  onReload?: (
    saved: GetItineraryResponse,
    recovery: ReloadOutcome,
    applied: boolean
  ) => void;
  activity?: "saving" | "loading";
  recovery?: ReloadOutcome;
};

interface RejectedEdit {
  entryId?: number;
  edit: EditTarget["edit"];
  message: string;
  inspected?: boolean;
}

type EditKind =
  | TimingField
  | "fixed-start"
  | AddItemEdit["action"]
  | Extract<EntryEdit, { action: string }>["action"];

export function editKind(edit: EditTarget["edit"]): EditKind {
  if ("action" in edit) return edit.action;
  return clockEditInput(edit)?.field ?? "fixed-start";
}

const editKey = (entryId: number, kind: EditKind): string =>
  `${entryId}:${kind}`;

export interface ItineraryTimingEditing {
  pending?: PendingEdit;
  rejections: readonly RejectedEdit[];
  feedback?: { entryId: number; text: string };
  hasClockInputs: boolean;
  getClockInput: (entryId: number, field: TimingField) => string | undefined;
  setClockInput: (entryId: number, field: TimingField, value?: string) => void;
  save: (
    entryId: number,
    edit: EntryEdit,
    onReload?: PendingEdit["onReload"]
  ) => Promise<EntryEditError | undefined>;
  addItem: (
    edit: AddItemEdit,
    onReload: PendingEdit["onReload"]
  ) => Promise<EntryEditError | undefined>;
  inspect: () => Promise<void>;
  discardRejection: (entryId: number | undefined, kind: EditKind) => void;
  discardDrafts: () => void;
}

function itemMatches(
  entry: ItineraryEntry | undefined,
  fields: ItineraryItemFields
): entry is TypedItineraryEntryResponse {
  return (
    entry !== undefined &&
    !isAttractionEntry(entry) &&
    entry.name === fields.name &&
    entry.note === fields.note &&
    entry.fixedStart === (fields.fixedStart ?? false) &&
    elapsedMinutes(entry.timing.start, entry.timing.end) ===
      fields.plannedMinutes
  );
}

function editIsReflected(
  saved: GetItineraryResponse,
  proposal: PendingEdit
): boolean {
  const { entryId, edit } = proposal;
  const day = saved.days.find(({ entries }) =>
    entries.some((entry) => entry.entryId === entryId)
  );
  const entry = day?.entries.find((item) => item.entryId === entryId);
  const sameClock = (a: string, b: string): boolean =>
    a.padEnd(8, ":00") === b.padEnd(8, ":00");
  if ("action" in edit) {
    if (edit.action === "add-item") {
      const { request, previousEntryIds } = edit;
      const entries =
        saved.days.find((item) => item.date === request.date)?.entries ?? [];
      const predecessor = entries.findIndex(
        ({ entryId }) => entryId === request.afterEntryId
      );
      if (request.afterEntryId !== undefined && predecessor < 0) return false;
      const added = entries[predecessor + 1];
      return (
        itemMatches(added, request.item) &&
        !previousEntryIds.has(added.entryId) &&
        added.kind === request.kind &&
        (request.startTime === undefined ||
          sameClock(localClock(added.timing.start), request.startTime))
      );
    }
    if (edit.action === "edit-item") return itemMatches(entry, edit.request);
    const attraction = entry && isAttractionEntry(entry) ? entry : undefined;
    if (edit.action === "reorder-group") {
      const members = attraction?.groupedAttractions;
      const { attractionIds } = edit.request;
      return (
        members?.length === attractionIds.length &&
        members.every(
          (member, index) => member.attractionId === attractionIds[index]
        )
      );
    }
    if (edit.action === "join") {
      return (
        attraction?.groupedAttractions?.some(
          (member) => member.attractionId === edit.request.attractionId
        ) === true
      );
    }
    if (edit.action === "move-group-member") {
      return saved.days.some(({ entries }) =>
        entries.some(
          (host) =>
            isAttractionEntry(host) &&
            host.entryId === edit.destinationEntryId &&
            host.groupedAttractions?.some(
              (member) => member.attractionId === edit.attractionId
            )
        )
      );
    }
    if (edit.action === "extract-group-member") {
      const { date, beforeEntryId, startTime } = edit.request;
      const entries =
        saved.days.find((item) => item.date === date)?.entries ?? [];
      const index = entries.findIndex(
        (item) =>
          isAttractionEntry(item) && item.attractionId === edit.attractionId
      );
      return (
        index >= 0 &&
        entries[index + 1]?.entryId === beforeEntryId &&
        (startTime === undefined ||
          (!entries[index].timing.repeatedStart &&
            sameClock(localClock(entries[index].timing.start), startTime)))
      );
    }
    if (edit.action === "remove-group-member") {
      return !saved.days.some(({ entries }) =>
        entries.some(
          (host) =>
            isAttractionEntry(host) &&
            (host.attractionId === edit.attractionId ||
              host.groupedAttractions?.some(
                (member) => member.attractionId === edit.attractionId
              ))
        )
      );
    }
    if (edit.action === "remove") return entry === undefined;
    if (edit.action === "transfer") {
      const transfer = entry?.outgoingTransfer;
      if (!edit.transfer) return transfer?.toEntryId !== edit.toEntryId;
      return (
        transfer?.toEntryId === edit.toEntryId &&
        transfer.mode === edit.transfer.mode &&
        transfer.minutes === edit.transfer.minutes &&
        transfer.note === edit.transfer.note
      );
    }
    if (!day || !entry || day.date !== edit.position.date) return false;
    const index = day.entries.indexOf(entry);
    return (
      day.entries[index + 1]?.entryId ===
        (edit.position.beforeEntryId ?? undefined) &&
      (edit.position.startOffset === undefined ||
        edit.position.startOffset === clockOffset(entry.timing.start))
    );
  }
  if (!entry) return false;
  const { start, end, repeatedStart, repeatedEnd } = entry.timing;
  const input = clockEditInput(edit);
  // Matching a clock alone does not identify its occurrence in a repeated hour.
  if (input?.field === "start")
    return !repeatedStart && sameClock(localClock(start), input.clock);
  if (input?.field === "end")
    return (
      !repeatedEnd &&
      end.startsWith(`${input.date}T`) &&
      sameClock(localClock(end), input.clock)
    );
  if (input?.field === "length")
    return elapsedMinutes(start, end) === input.minutes;
  return "fixedStart" in edit && entry.fixedStart === edit.fixedStart;
}

export function useItineraryTimingEdit(
  tripId: number | undefined,
  refresh: () => Promise<GetItineraryResponse | undefined>,
  workspace: PlanningWorkspace
): ItineraryTimingEditing {
  const [state, setState] = useState<PendingEdit>();
  const [rejections, setRejections] = useState<RejectedEdit[]>([]);
  const [clockInputs, setClockInputs] = useState(new Map<string, string>());
  const [feedback, setFeedback] = useState<{
    tripId: number;
    entryId: number;
    text: string;
  }>();
  const pending = state?.tripId === tripId ? state : undefined;
  const inFlight = useRef(false);

  const discardRejection: ItineraryTimingEditing["discardRejection"] = (
    entryId,
    kind
  ) => {
    setRejections((current) =>
      current.filter(
        (item) => item.entryId !== entryId || editKind(item.edit) !== kind
      )
    );
  };
  const rememberRejection = (rejection: RejectedEdit): void => {
    setRejections((current) => [...current, rejection]);
  };
  const setClockInput: ItineraryTimingEditing["setClockInput"] = (
    entryId,
    field,
    value
  ) => {
    setClockInputs((previous) => {
      const next = new Map(previous);
      const key = editKey(entryId, field);
      if (value === undefined) next.delete(key);
      else next.set(key, value);
      return next;
    });
  };

  const reload = async (
    edit: PendingEdit,
    recovery: ReloadOutcome
  ): Promise<void> => {
    setState({ ...edit, activity: "loading" });
    const saved = await refresh();
    if (saved) {
      setState(undefined);
      const applied = recovery === "refresh" || editIsReflected(saved, edit);
      if (!applied) {
        rememberRejection({
          ...edit,
          inspected: true,
          message:
            "Compare this entry change with the saved itinerary before trying again."
        });
      }
      if (edit.onReload) {
        edit.onReload(saved, recovery, applied);
      } else if (edit.entryId !== undefined) {
        setFeedback({
          tripId: edit.tripId,
          entryId: edit.entryId,
          text:
            recovery === "unconfirmed"
              ? "Saved entry reloaded. Inspect the entry before editing again."
              : "Itinerary entry updated."
        });
      }
    } else {
      setState({ ...edit, activity: undefined, recovery });
    }
  };

  const submit = async (
    proposal: EditTarget,
    onReload?: PendingEdit["onReload"]
  ): Promise<EntryEditError | undefined> => {
    if (tripId === undefined || inFlight.current || pending) {
      return new EntryEditError(
        "Wait for the pending itinerary change before editing again.",
        false
      );
    }
    const release = workspace.beginWrite();
    if (!release) {
      return new EntryEditError(
        "Wait for the pending planning change before editing again.",
        false
      );
    }
    const target = { ...proposal, tripId, onReload };
    inFlight.current = true;
    setState({ ...target, activity: "saving" });
    setFeedback(undefined);
    discardRejection(proposal.entryId, editKind(proposal.edit));
    if (proposal.entryId !== undefined) {
      const clock = clockEditInput(proposal.edit);
      if (clock) setClockInput(proposal.entryId, clock.field);
    }
    try {
      try {
        if (proposal.entryId === undefined) {
          await saveItemAddition(tripId, proposal.edit.request);
        } else {
          await saveEntryEdit(tripId, proposal.entryId, proposal.edit);
        }
      } catch (error) {
        if (error instanceof EntryEditError && !error.unconfirmed) {
          setState(undefined);
          rememberRejection({ ...target, message: error.message });
          return error;
        }
        setState({ ...target, recovery: "unconfirmed" });
        return;
      }
      await reload(target, "refresh");
    } finally {
      inFlight.current = false;
      release();
    }
  };

  const inspect = async (): Promise<void> => {
    if (!pending?.recovery || inFlight.current) return;
    inFlight.current = true;
    try {
      await reload(pending, pending.recovery);
    } finally {
      inFlight.current = false;
    }
  };

  return {
    pending,
    rejections,
    feedback: feedback?.tripId === tripId ? feedback : undefined,
    hasClockInputs: clockInputs.size > 0,
    getClockInput: (entryId, field) => clockInputs.get(editKey(entryId, field)),
    setClockInput,
    save: (entryId, edit, onReload) => submit({ entryId, edit }, onReload),
    addItem: (edit, onReload) => submit({ edit }, onReload),
    inspect,
    discardRejection,
    discardDrafts: () => {
      setRejections([]);
      setClockInputs(new Map());
    }
  };
}
