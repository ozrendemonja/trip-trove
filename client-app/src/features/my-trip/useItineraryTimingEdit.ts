import { useRef, useState } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import {
  EntryEditError,
  saveEntryEdit,
  type EntryEdit
} from "./infra/ItinerarySchedulingApi";

type ReloadOutcome = "unconfirmed" | "refresh";

interface PendingEdit {
  tripId: number;
  entryId: number;
  onReload?: (saved: GetItineraryResponse, recovery: ReloadOutcome) => void;
  activity?: "saving" | "loading";
  recovery?: ReloadOutcome;
}

export interface ItineraryTimingEditing {
  pending?: PendingEdit;
  feedback?: { entryId: number; text: string };
  save: (
    entryId: number,
    edit: EntryEdit,
    onReload?: PendingEdit["onReload"]
  ) => Promise<EntryEditError | undefined>;
  inspect: () => Promise<void>;
}

export function useItineraryTimingEdit(
  tripId: number | undefined,
  refresh: () => Promise<GetItineraryResponse | undefined>
): ItineraryTimingEditing {
  const [state, setState] = useState<PendingEdit>();
  const [feedback, setFeedback] = useState<{
    tripId: number;
    entryId: number;
    text: string;
  }>();
  const pending = state?.tripId === tripId ? state : undefined;
  const inFlight = useRef(false);

  const reload = async (
    edit: PendingEdit,
    recovery: ReloadOutcome
  ): Promise<void> => {
    setState({ ...edit, activity: "loading" });
    const saved = await refresh();
    if (saved) {
      setState(undefined);
      if (edit.onReload) {
        edit.onReload(saved, recovery);
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
    const target = { tripId, entryId, onReload };
    inFlight.current = true;
    setState({ ...target, activity: "saving" });
    setFeedback(undefined);
    try {
      try {
        await saveEntryEdit(tripId, entryId, edit);
      } catch (error) {
        if (error instanceof EntryEditError && !error.unconfirmed) {
          setState(undefined);
          return error;
        }
        setState({ ...target, recovery: "unconfirmed" });
        return;
      }
      await reload(target, "refresh");
    } finally {
      inFlight.current = false;
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
    feedback: feedback?.tripId === tripId ? feedback : undefined,
    save,
    inspect
  };
}
