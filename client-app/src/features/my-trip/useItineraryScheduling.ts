import { useEffect, useRef, useState } from "react";
import type {
  GetItineraryResponse,
  ItineraryTransferRemovalResponse,
  MissingInputs,
  ScheduleAttractionRequest
} from "../../clients/manager";
import { EntrySaveError, saveEntry } from "./infra/ItinerarySchedulingApi";
import { clockOffset, localClock } from "./itineraryClocks";
import type { PlanningWorkspace } from "./useTripPlanningWorkspace";

type Attraction = GetItineraryResponse["unscheduledAttractions"][number];
type Day = GetItineraryResponse["days"][number];
type Input = NonNullable<MissingInputs["requiredInputs"]>[number];
type Field = "startTime" | "visitDuration" | "timeZone";
type Suggestion = Pick<ScheduleAttractionRequest, "startTime" | "startOffset">;

const durationFormat =
  /^(?:(?:\d+h(?:\s*\d+m)?|\d+m)(?:\s*-\s*(?:\d+h(?:\s*\d+m)?|\d+m))?|\d+\s*-\s*\d+[hm])$/;

export const hasVisitDurationFormat = (value?: string): boolean =>
  durationFormat.test(value?.trim() ?? "");

const suggestedStart = ({
  date,
  entries
}: Day): Pick<ScheduleAttractionRequest, "startTime"> => {
  const end = entries.at(-1)?.timing.end;
  if (!end?.startsWith(`${date}T`) || !clockOffset(end)) return {};
  return { startTime: localClock(end) };
};

export interface EntryDraft {
  tripId: number;
  attraction: Attraction;
  intent: ScheduleAttractionRequest;
  inputs: Input[];
  activity?: "saving" | "loading";
  message?: string;
  unconfirmed?: boolean;
  transfersToRemove?: ItineraryTransferRemovalResponse[];
}

interface Context {
  tripId?: number;
  timeZone?: string;
  loadSaved: () => Promise<GetItineraryResponse | undefined>;
  showDate: (date: string) => void;
  onDurationCorrected: (attractionId: number, duration: string) => void;
  workspace: PlanningWorkspace;
}

export interface ItineraryScheduling {
  draft?: EntryDraft;
  feedback?: string;
  choose: (
    attraction: Attraction,
    day: Day,
    button: HTMLButtonElement | null,
    suggestion?: Suggestion
  ) => void;
  update: (field: Field, value: string) => void;
  submit: () => Promise<void>;
  submitWithTransfersToRemove: () => Promise<void>;
  inspect: () => Promise<void>;
  cancel: () => void;
}

export function useItineraryScheduling({
  tripId,
  timeZone,
  loadSaved,
  showDate,
  onDurationCorrected,
  workspace
}: Context): ItineraryScheduling {
  const [state, setDraft] = useState<EntryDraft>();
  const draft = state?.tripId === tripId ? state : undefined;
  const inFlight = useRef(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [feedback, setFeedback] = useState<{ tripId: number; text: string }>();

  // Return focus only after the draft unmounts, so cancelling cannot save on blur.
  useEffect(() => {
    if (state) return;
    const button = trigger.current;
    trigger.current = null;
    button?.focus();
  }, [state]);

  const finish = (entryDraft: EntryDraft, date: string): void => {
    const { attractionId, visitDuration } = entryDraft.intent;
    showDate(date);
    if (visitDuration !== undefined) {
      onDurationCorrected(attractionId, visitDuration);
    }
    trigger.current = null;
    setDraft(undefined);
    setFeedback({
      tripId: entryDraft.tripId,
      text: `${entryDraft.attraction.name} is saved in the itinerary.`
    });
  };

  const save = async (entryDraft: EntryDraft): Promise<void> => {
    if (inFlight.current) return;
    const release = workspace.beginWrite();
    if (!release) return;
    inFlight.current = true;
    setDraft({ ...entryDraft, activity: "saving", message: undefined });
    try {
      try {
        await saveEntry(entryDraft.tripId, entryDraft.intent);
      } catch (error) {
        const failure = error instanceof EntrySaveError ? error : undefined;
        const unconfirmed = failure?.unconfirmed ?? true;
        const required = failure?.schedulingInputs?.requiredInputs ?? [];
        setDraft({
          ...entryDraft,
          activity: undefined,
          unconfirmed,
          transfersToRemove: failure?.transfersToRemove,
          inputs: [...new Set([...entryDraft.inputs, ...required])],
          message: unconfirmed
            ? "The save couldn't be confirmed. Inspect the saved itinerary before trying again."
            : required.includes("VISIT_DURATION") &&
                entryDraft.intent.visitDuration
              ? "Enter a valid visit duration or range in whole hours and minutes."
              : failure?.message
        });
        return;
      }
      await loadSaved();
      finish(entryDraft, entryDraft.intent.date);
    } finally {
      inFlight.current = false;
      release();
    }
  };

  const choose = (
    attraction: Attraction,
    day: Day,
    button: HTMLButtonElement | null,
    suggestion?: Suggestion
  ): void => {
    if (tripId === undefined || draft || inFlight.current) return;
    trigger.current = button;
    showDate(day.date);
    setFeedback(undefined);
    const inputs: Input[] = [];
    if (!hasVisitDurationFormat(attraction.visitDuration)) {
      inputs.push("VISIT_DURATION");
    }
    if (!timeZone) inputs.push("TIME_ZONE");
    setDraft({
      tripId,
      attraction,
      intent: {
        attractionId: attraction.attractionId,
        date: day.date,
        ...(suggestion ?? suggestedStart(day))
      },
      inputs
    });
  };

  const update = (field: Field, value: string): void => {
    if (!draft || inFlight.current || draft.unconfirmed) return;
    setDraft({
      ...draft,
      intent: {
        ...draft.intent,
        transfersToRemove: undefined,
        ...(field === "startTime" ? { startOffset: undefined } : {}),
        [field]: value || undefined
      },
      message: undefined
    });
  };

  const submit = async (): Promise<void> => {
    if (draft && !draft.unconfirmed && !draft.transfersToRemove) {
      await save(draft);
    }
  };

  const submitWithTransfersToRemove = async (): Promise<void> => {
    if (!draft?.transfersToRemove) return;
    await save({
      ...draft,
      transfersToRemove: undefined,
      intent: {
        ...draft.intent,
        transfersToRemove: draft.transfersToRemove.map(
          ({ transfer }) => transfer
        )
      }
    });
  };

  const inspect = async (): Promise<void> => {
    if (!draft?.unconfirmed || inFlight.current) return;
    inFlight.current = true;
    setDraft({ ...draft, activity: "loading" });
    try {
      const saved = await loadSaved();
      const savedDay = saved?.days.find((day) =>
        day.entries.some(
          (entry) => entry.attractionId === draft.intent.attractionId
        )
      );
      if (!saved) {
        setDraft({
          ...draft,
          message:
            "The saved itinerary couldn't be loaded. Try inspecting it again."
        });
      } else if (savedDay) {
        finish(draft, savedDay.date);
      } else {
        setDraft({
          ...draft,
          unconfirmed: false,
          message:
            "The saved itinerary does not contain this attraction. You can try adding it again."
        });
      }
    } finally {
      inFlight.current = false;
    }
  };

  const cancel = (): void => {
    if (inFlight.current || draft?.unconfirmed) return;
    setDraft(undefined);
  };

  return {
    draft,
    feedback: feedback?.tripId === tripId ? feedback?.text : undefined,
    choose,
    update,
    submit,
    submitWithTransfersToRemove,
    inspect,
    cancel
  };
}
