import { useRef, useState } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import {
  saveTimingEdit,
  type TimingEdit
} from "./infra/ItinerarySchedulingApi";
import { PlanningSaveError } from "./infra/PlanningApi";

interface PendingEdit {
  tripId: number;
  entryId: number;
  activity?: "saving" | "loading";
  recovery?: "unconfirmed" | "refresh";
}

export interface ItineraryTimingEditing {
  pending?: PendingEdit;
  feedback?: { entryId: number; text: string };
  save: (entryId: number, edit: TimingEdit) => Promise<string | undefined>;
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
    recovery: NonNullable<PendingEdit["recovery"]>
  ): Promise<void> => {
    setState({ ...edit, activity: "loading" });
    if (await refresh()) {
      setState(undefined);
      setFeedback({
        ...edit,
        text:
          recovery === "unconfirmed"
            ? "Saved entry reloaded. Inspect the entry before editing again."
            : "Itinerary entry updated."
      });
    } else {
      setState({ ...edit, activity: undefined, recovery });
    }
  };

  const save: ItineraryTimingEditing["save"] = async (entryId, edit) => {
    if (tripId === undefined || inFlight.current || pending) {
      return "Wait for the pending itinerary change before editing again.";
    }
    const target = { tripId, entryId };
    inFlight.current = true;
    setState({ ...target, activity: "saving" });
    setFeedback(undefined);
    try {
      try {
        await saveTimingEdit(tripId, entryId, edit);
      } catch (error) {
        if (error instanceof PlanningSaveError && !error.unconfirmed) {
          setState(undefined);
          return error.message;
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
