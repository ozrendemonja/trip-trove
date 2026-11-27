import { useRef, useState } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import {
  EntryEditError,
  saveEntryEdit,
  type EntryEdit
} from "./infra/ItinerarySchedulingApi";
import type { PlanningWorkspace } from "./useTripPlanningWorkspace";
import {
  clockEditInput,
  clockOffset,
  elapsedMinutes,
  localClock,
  type TimingField
} from "./itineraryClocks";

type ReloadOutcome = "unconfirmed" | "refresh";

interface PendingEdit {
  tripId: number;
  entryId: number;
  edit: EntryEdit;
  onReload?: (
    saved: GetItineraryResponse,
    recovery: ReloadOutcome,
    applied: boolean
  ) => void;
  activity?: "saving" | "loading";
  recovery?: ReloadOutcome;
}

interface RejectedEdit {
  entryId: number;
  edit: EntryEdit;
  message: string;
  inspected?: boolean;
}

type EditKind = TimingField | "move" | "remove" | "fixed-start" | "transfer";

export function editKind(edit: EntryEdit): EditKind {
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
  inspect: () => Promise<void>;
  discardRejection: (entryId: number, kind: EditKind) => void;
  discardDrafts: () => void;
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
  if ("action" in edit) {
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
  const sameClock = (a: string, b: string): boolean =>
    a.padEnd(8, ":00") === b.padEnd(8, ":00");
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

  const discardRejection = (entryId: number, kind: EditKind): void => {
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
      } else {
        setFeedback({
          ...edit,
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

  const save: ItineraryTimingEditing["save"] = async (
    entryId,
    edit,
    onReload
  ) => {
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
    const target = { tripId, entryId, edit, onReload };
    inFlight.current = true;
    setState({ ...target, activity: "saving" });
    setFeedback(undefined);
    discardRejection(entryId, editKind(edit));
    const clock = clockEditInput(edit);
    if (clock) setClockInput(entryId, clock.field);
    try {
      try {
        await saveEntryEdit(tripId, entryId, edit);
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
    save,
    inspect,
    discardRejection,
    discardDrafts: () => {
      setRejections([]);
      setClockInputs(new Map());
    }
  };
}
