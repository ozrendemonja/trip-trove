import { useEffect, useRef, useState } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import { saveDayNote } from "./infra/ItinerarySchedulingApi";
import { PlanningSaveError } from "./infra/PlanningApi";
import type { PlanningWorkspace } from "./useTripPlanningWorkspace";

type Recovery = "unconfirmed" | "refresh";

interface NoteDraft {
  date: string;
  subject: string;
  text: string;
  activity?: "saving" | "loading";
  recovery?: Recovery;
  message?: string;
}

export const dayNoteField = { label: "Day note", maxLength: 2000 } as const;

export function dayNoteLengthError(text: string): string | undefined {
  const { label, maxLength } = dayNoteField;
  return text.length > maxLength
    ? `${label} may not be longer than ${maxLength} characters.`
    : undefined;
}

export function useItineraryDayNotes(
  tripId: number | undefined,
  refresh: () => Promise<GetItineraryResponse | undefined>,
  workspace: PlanningWorkspace
) {
  const [draft, setDraft] = useState<NoteDraft>();
  const [savedDate, setSavedDate] = useState<string>();
  const trigger = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (draft || !trigger.current) return;
    const button = trigger.current;
    trigger.current = null;
    const frame = requestAnimationFrame(() => {
      if (button.isConnected) button.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [draft]);

  const open = (
    date: string,
    subject: string,
    note: string | undefined,
    button: HTMLButtonElement
  ): void => {
    if (tripId === undefined || draft || workspace.isWriting()) return;
    trigger.current = button;
    setDraft({ date, subject, text: note ?? "" });
  };

  const update = (text: string): void => {
    if (!draft || inFlight.current || draft.recovery) return;
    setDraft({ ...draft, text, message: undefined });
  };

  const cancel = (): void => {
    if (inFlight.current || draft?.recovery === "unconfirmed") return;
    setDraft(undefined);
  };

  const loadSaved = async (proposal: NoteDraft, recovery: Recovery) => {
    setDraft({ ...proposal, activity: "loading", recovery });
    const saved = await refresh();
    if (!saved) {
      setDraft({
        ...proposal,
        recovery,
        message:
          recovery === "refresh"
            ? "The note was saved, but the itinerary couldn't be refreshed."
            : "The saved itinerary couldn't be loaded. Inspect it before trying to save the note again."
      });
    } else if (
      saved.days.some(
        (day) =>
          day.date === proposal.date && (day.note ?? "") === proposal.text
      )
    ) {
      setSavedDate(proposal.date);
      setDraft(undefined);
    } else {
      setDraft({
        ...proposal,
        recovery: undefined,
        message:
          "This change isn't in the saved itinerary. Review the note before trying again."
      });
    }
  };

  const save = async (): Promise<void> => {
    if (
      tripId === undefined ||
      !draft ||
      inFlight.current ||
      draft.recovery ||
      dayNoteLengthError(draft.text)
    )
      return;
    const release = workspace.beginWrite();
    if (!release) {
      setDraft({ ...draft, message: "Wait for the current planning save." });
      return;
    }
    inFlight.current = true;
    setSavedDate(undefined);
    setDraft({ ...draft, activity: "saving", message: undefined });
    try {
      try {
        await saveDayNote(tripId, draft.date, draft.text);
      } catch (error) {
        const rejected =
          error instanceof PlanningSaveError && !error.unconfirmed;
        setDraft(
          rejected
            ? { ...draft, message: error.message }
            : {
                ...draft,
                recovery: "unconfirmed",
                message:
                  "The save couldn't be confirmed. Inspect the saved itinerary before trying again."
              }
        );
        return;
      }
      await loadSaved(draft, "refresh");
    } finally {
      inFlight.current = false;
      release();
    }
  };

  const inspect = async (): Promise<void> => {
    if (!draft?.recovery || inFlight.current) return;
    inFlight.current = true;
    try {
      await loadSaved({ ...draft, message: undefined }, draft.recovery);
    } finally {
      inFlight.current = false;
    }
  };

  return { draft, open, update, cancel, save, inspect, savedDate };
}
