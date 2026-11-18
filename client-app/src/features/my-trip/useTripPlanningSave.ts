import { useCallback, useRef, useState } from "react";
import type { TripPlanningChange } from "./domain/TripPlanning.types";
import { savePlanningChange } from "./infra/PlanningApi";

interface PlanningProposal {
  subjectIds: number[];
  subjectName: string;
  description: string;
  changes: TripPlanningChange[];
  onCommitted?: (change: TripPlanningChange) => void;
}

export interface PlanningFeedback {
  proposal: PlanningProposal;
  state: "saving" | "saved" | "error";
  message?: string;
  refreshing?: boolean;
  failedChange?: TripPlanningChange;
}

interface TripPlanningSave {
  feedback: PlanningFeedback | undefined;
  blocked: boolean;
  isBlocked: () => boolean;
  submit: (proposal: PlanningProposal) => boolean;
  clearSaveError: () => void;
  reload: () => Promise<void>;
}

export const useTripPlanningSave = (
  tripId: number | undefined,
  refresh: () => Promise<void>
): TripPlanningSave => {
  const pending = useRef(false);
  const working = useRef(false);
  const [feedback, setFeedback] = useState<PlanningFeedback>();

  const submit = useCallback(
    (proposal: PlanningProposal): boolean => {
      if (pending.current) return false;
      if (tripId === undefined || proposal.changes.length === 0) return true;
      pending.current = true;
      working.current = true;
      setFeedback({ proposal, state: "saving" });
      void (async () => {
        let completed = 0;
        try {
          for (const change of proposal.changes) {
            await savePlanningChange(tripId, change);
            proposal.onCommitted?.(change);
            completed++;
          }
          pending.current = false;
          setFeedback({ proposal, state: "saved" });
        } catch (error) {
          const reason =
            error instanceof Error
              ? error.message
              : "The save couldn't be confirmed. Reload saved planning before trying again.";
          setFeedback({
            proposal,
            state: "error",
            failedChange: proposal.changes[completed],
            message:
              completed > 0
                ? `${completed} of ${proposal.changes.length} changes saved. ${reason}`
                : reason
          });
        } finally {
          working.current = false;
        }
      })();
      return true;
    },
    [tripId]
  );

  const clearSaveError = useCallback(() => {
    if (working.current) return;
    pending.current = false;
    setFeedback(undefined);
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    if (working.current) return;
    working.current = true;
    setFeedback((previous) =>
      previous ? { ...previous, refreshing: true } : previous
    );
    try {
      await refresh();
      pending.current = false;
      setFeedback(undefined);
    } catch (error) {
      setFeedback((previous) =>
        previous
          ? {
              ...previous,
              refreshing: false,
              message: `Saved planning couldn't be loaded. ${error instanceof Error ? error.message : "Try reloading again."}`
            }
          : previous
      );
    } finally {
      working.current = false;
    }
  }, [refresh]);

  return {
    feedback,
    blocked: feedback !== undefined && feedback.state !== "saved",
    isBlocked: useCallback(() => pending.current, []),
    submit,
    clearSaveError,
    reload
  };
};
