import { useRef, useState } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import { saveItineraryCheck } from "./infra/TripApi";
import { PlanningSaveError } from "./infra/PlanningApi";
import type { PlanningWorkspace } from "./useTripPlanningWorkspace";

type Attempt = {
  tripId: number;
  activity?: "saving" | "inspecting";
  unconfirmed?: boolean;
  rejected?: boolean;
  lastCheckedAt?: string;
  message?: string;
};

interface ItineraryCheck {
  activity: Attempt["activity"];
  unconfirmed: boolean;
  rejected: boolean;
  locked: boolean;
  message?: string;
  submit: (saved: GetItineraryResponse) => Promise<void>;
  inspect: () => Promise<void>;
  discardRejection: () => void;
}

export function useItineraryCheck(
  tripId: number | undefined,
  refresh: () => Promise<GetItineraryResponse | undefined>,
  workspace: PlanningWorkspace
): ItineraryCheck {
  const [attempt, setAttempt] = useState<Attempt>();
  const current = attempt?.tripId === tripId ? attempt : undefined;
  const inFlight = useRef(false);
  const unconfirmed = current?.unconfirmed ?? false;

  const submit = async (saved: GetItineraryResponse): Promise<void> => {
    if (inFlight.current || unconfirmed || saved.tripId !== tripId) return;
    const release = workspace.beginWrite();
    if (!release) return;
    inFlight.current = true;
    const previous = { tripId, lastCheckedAt: saved.lastCheckedAt };
    setAttempt({ ...previous, activity: "saving" });
    try {
      try {
        await saveItineraryCheck(tripId);
      } catch (error) {
        const failure = error instanceof PlanningSaveError ? error : undefined;
        const uncertain = failure?.unconfirmed ?? true;
        setAttempt({
          ...previous,
          unconfirmed: uncertain,
          rejected: !uncertain,
          message: uncertain
            ? "The check couldn't be confirmed. Inspect the saved check state before trying again."
            : failure?.message
        });
        return;
      }
      const latest = await refresh();
      setAttempt({
        tripId,
        message: latest
          ? undefined
          : "The check was saved, but the itinerary couldn't be refreshed."
      });
    } finally {
      inFlight.current = false;
      release();
    }
  };

  const inspect = async (): Promise<void> => {
    if (!current?.unconfirmed || inFlight.current) return;
    inFlight.current = true;
    setAttempt({ ...current, activity: "inspecting", message: undefined });
    const latest = await refresh();
    setAttempt({
      tripId: current.tripId,
      lastCheckedAt: current.lastCheckedAt,
      unconfirmed: !latest,
      message: !latest
        ? "The saved check state couldn't be loaded. Try inspecting it again."
        : latest.lastCheckedAt !== current.lastCheckedAt
          ? "The saved itinerary has a newer manual check."
          : "No newer check was found. Review the saved itinerary before confirming again."
    });
    inFlight.current = false;
  };

  return {
    activity: current?.activity,
    unconfirmed,
    rejected: !!current?.rejected,
    locked: unconfirmed || !!current?.activity,
    message: current?.message,
    submit,
    inspect,
    discardRejection: () => {
      if (current?.rejected) setAttempt(undefined);
    }
  };
}
