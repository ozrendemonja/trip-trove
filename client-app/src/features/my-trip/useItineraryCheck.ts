import { useRef, useState } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import { saveItineraryCheck } from "./infra/TripApi";
import { PlanningSaveError } from "./infra/PlanningApi";

type Attempt = {
  tripId: number;
  activity?: "saving" | "inspecting";
  unconfirmed?: boolean;
  lastCheckedAt?: string;
  message?: string;
};

interface ItineraryCheck {
  activity: Attempt["activity"];
  unconfirmed: boolean;
  locked: boolean;
  message?: string;
  submit: (saved: GetItineraryResponse) => Promise<void>;
  inspect: () => Promise<void>;
}

export function useItineraryCheck(
  tripId: number | undefined,
  refresh: () => Promise<GetItineraryResponse | undefined>
): ItineraryCheck {
  const [attempt, setAttempt] = useState<Attempt>();
  const current = attempt?.tripId === tripId ? attempt : undefined;
  const inFlight = useRef(false);
  const unconfirmed = current?.unconfirmed ?? false;

  const submit = async (saved: GetItineraryResponse): Promise<void> => {
    if (inFlight.current || unconfirmed || saved.tripId !== tripId) return;
    inFlight.current = true;
    const previous = { tripId, lastCheckedAt: saved.lastCheckedAt };
    setAttempt({ ...previous, activity: "saving" });
    try {
      await saveItineraryCheck(tripId);
    } catch (error) {
      const failure = error instanceof PlanningSaveError ? error : undefined;
      const uncertain = failure?.unconfirmed ?? true;
      setAttempt({
        ...previous,
        unconfirmed: uncertain,
        message: uncertain
          ? "The check couldn't be confirmed. Inspect the saved check state before trying again."
          : failure?.message
      });
      inFlight.current = false;
      return;
    }

    const latest = await refresh();
    setAttempt({
      tripId,
      message: latest
        ? undefined
        : "The check was saved, but the itinerary couldn't be refreshed."
    });
    inFlight.current = false;
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
    locked: unconfirmed || !!current?.activity,
    message: current?.message,
    submit,
    inspect
  };
}
