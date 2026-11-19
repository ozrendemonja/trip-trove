import { useCallback, useRef, useState } from "react";
import type { TripPlanningChange } from "./domain/TripPlanning.types";
import { PlanningSaveError, savePlanningChange } from "./infra/PlanningApi";

interface PlanningProposal {
  subjectIds: number[];
  subjectName: string;
  description: string;
  changes: TripPlanningChange[];
  allowRetryAfterRejection?: boolean;
  onCommitted?: (change: TripPlanningChange) => void;
}

export interface PlanningFeedback {
  proposal: PlanningProposal;
  state: "saving" | "saved" | "error";
  message?: string;
  refreshing?: boolean;
  failedChange?: TripPlanningChange;
  unconfirmed?: boolean;
}

interface TripPlanningSave {
  feedback: PlanningFeedback | undefined;
  blocked: boolean;
  isBlocked: () => boolean;
  submit: (proposal: PlanningProposal) => boolean;
  save: (proposal: PlanningProposal) => Promise<boolean>;
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

  const save = useCallback(
    async (proposal: PlanningProposal): Promise<boolean> => {
      if (pending.current) return false;
      if (tripId === undefined || proposal.changes.length === 0) return true;
      pending.current = true;
      working.current = true;
      setFeedback({ proposal, state: "saving" });
      let completed = 0;
      try {
        for (const change of proposal.changes) {
          await savePlanningChange(tripId, change);
          proposal.onCommitted?.(change);
          completed++;
        }
        pending.current = false;
        setFeedback({ proposal, state: "saved" });
        return true;
      } catch (error) {
        const failedChange = proposal.changes[completed];
        const unconfirmed =
          !(error instanceof PlanningSaveError) || error.unconfirmed;
        pending.current = unconfirmed || !proposal.allowRetryAfterRejection;
        const reason =
          error instanceof Error
            ? error.message
            : "The save couldn't be confirmed. Reload saved planning before trying again.";
        setFeedback({
          proposal,
          state: "error",
          failedChange,
          unconfirmed,
          message:
            completed > 0
              ? `${completed} of ${proposal.changes.length} changes saved. ${reason}`
              : reason
        });
        return false;
      } finally {
        working.current = false;
      }
    },
    [tripId]
  );

  const submit = useCallback(
    (proposal: PlanningProposal): boolean => {
      if (pending.current) return false;
      void save(proposal);
      return true;
    },
    [save]
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
    blocked:
      feedback !== undefined &&
      feedback.state !== "saved" &&
      !(
        feedback.state === "error" &&
        feedback.proposal.allowRetryAfterRejection &&
        !feedback.unconfirmed
      ),
    isBlocked: useCallback(() => pending.current, []),
    submit,
    save,
    clearSaveError,
    reload
  };
};
