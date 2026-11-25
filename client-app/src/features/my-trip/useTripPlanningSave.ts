import { useCallback, useRef, useState } from "react";
import type { TripPlanningChange } from "./domain/TripPlanning.types";
import {
  BoardRemovalConfirmationError,
  PLANNING_REQUEST_TIMEOUT_MS,
  PlanningSaveError,
  savePlanningChange
} from "./infra/PlanningApi";
import type { PlanningWorkspace } from "./useTripPlanningWorkspace";

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
  needsRemovalConfirmation?: boolean;
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
  inspect: (change: TripPlanningChange) => Promise<boolean>,
  workspace?: PlanningWorkspace
): TripPlanningSave => {
  const pending = useRef(false);
  const working = useRef(false);
  const [feedback, setFeedback] = useState<PlanningFeedback>();

  const save = useCallback(
    async (proposal: PlanningProposal): Promise<boolean> => {
      if (pending.current) return false;
      if (tripId === undefined || proposal.changes.length === 0) {
        for (const change of proposal.changes) proposal.onCommitted?.(change);
        return true;
      }
      const release = workspace?.beginWrite();
      if (workspace && !release) return false;
      pending.current = true;
      working.current = true;
      setFeedback({ proposal, state: "saving" });
      let completed = 0;
      try {
        for (const change of proposal.changes) {
          await savePlanningChange(
            tripId,
            change,
            AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
          );
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
          error instanceof PlanningSaveError
            ? error.message
            : "The save couldn't be confirmed. Reload saved planning before trying again.";
        setFeedback({
          proposal: { ...proposal, changes: proposal.changes.slice(completed) },
          state: "error",
          failedChange,
          needsRemovalConfirmation:
            error instanceof BoardRemovalConfirmationError,
          unconfirmed,
          message:
            completed > 0
              ? `${completed} of ${proposal.changes.length} changes saved. ${reason}`
              : reason
        });
        return false;
      } finally {
        working.current = false;
        release?.();
      }
    },
    [tripId, workspace]
  );

  const submit = useCallback(
    (proposal: PlanningProposal): boolean => {
      if (pending.current || workspace?.isWriting()) return false;
      void save(proposal);
      return true;
    },
    [save, workspace]
  );

  const clearSaveError = useCallback(() => {
    if (working.current) return;
    pending.current = false;
    setFeedback(undefined);
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    if (working.current || !feedback?.unconfirmed || !feedback.failedChange)
      return;
    working.current = true;
    setFeedback((previous) =>
      previous ? { ...previous, refreshing: true } : previous
    );
    try {
      const committed = await inspect(feedback.failedChange);
      const changes = committed
        ? feedback.proposal.changes.slice(1)
        : feedback.proposal.changes;
      pending.current = changes.length > 0;
      setFeedback(
        changes.length === 0
          ? { proposal: feedback.proposal, state: "saved" }
          : {
              proposal: { ...feedback.proposal, changes },
              state: "error",
              failedChange: changes[0],
              message:
                "Saved planning is loaded. This change is not reflected in the saved board."
            }
      );
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
  }, [feedback, inspect]);

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
    isBlocked: useCallback(
      () => pending.current || !!workspace?.isWriting(),
      [workspace]
    ),
    submit,
    save,
    clearSaveError,
    reload
  };
};
