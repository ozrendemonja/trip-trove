import {
  moveItineraryEntry,
  removeItineraryEntry,
  scheduleAttraction,
  updateItineraryDayNote,
  updateItineraryEntryEnd,
  updateItineraryEntryFixedStart,
  updateItineraryEntryPlannedLength,
  updateItineraryEntryStart,
  type ErrorResponse,
  type MoveItineraryEntryRequest,
  type ScheduleAttractionRequest,
  type UpdateItineraryEntryEndRequest,
  type UpdateItineraryEntryFixedStartRequest,
  type UpdateItineraryEntryPlannedLengthRequest,
  type UpdateItineraryEntryStartRequest
} from "../../../clients/manager";
import {
  isUnconfirmedSave,
  PLANNING_REQUEST_TIMEOUT_MS,
  PlanningSaveError
} from "./PlanningApi";

const itineraryHeaders = { "x-api-version": "1" } as const;

export async function saveDayNote(
  tripId: number,
  date: string,
  note: string
): Promise<void> {
  const { response, error } = await updateItineraryDayNote({
    path: { id: tripId, date },
    body: { note },
    headers: itineraryHeaders,
    signal: AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
  });
  if (!response?.ok) {
    throw new PlanningSaveError(
      error?.errorMessage ?? "The day note couldn't be saved.",
      isUnconfirmedSave(response)
    );
  }
}

export class EntrySaveError extends PlanningSaveError {
  constructor(
    message: string,
    unconfirmed: boolean,
    readonly schedulingInputs: ErrorResponse["schedulingInputs"]
  ) {
    super(message, unconfirmed);
  }
}

export type TimingEdit =
  | UpdateItineraryEntryStartRequest
  | UpdateItineraryEntryEndRequest
  | UpdateItineraryEntryPlannedLengthRequest
  | UpdateItineraryEntryFixedStartRequest;

export type EntryEdit =
  | TimingEdit
  | { action: "move"; position: MoveItineraryEntryRequest }
  | { action: "remove" };

export class EntryEditError extends PlanningSaveError {
  constructor(
    message: string,
    unconfirmed: boolean,
    readonly moveOffsets?: string[]
  ) {
    super(message, unconfirmed);
  }
}

export async function saveEntryEdit(
  tripId: number,
  entryId: number,
  edit: EntryEdit
): Promise<void> {
  const options = {
    path: { id: tripId, entryId },
    headers: itineraryHeaders,
    signal: AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
  };
  const result = (() => {
    if ("action" in edit) {
      return edit.action === "move"
        ? moveItineraryEntry({ ...options, body: edit.position })
        : removeItineraryEntry(options);
    }
    if ("startTime" in edit)
      return updateItineraryEntryStart({ ...options, body: edit });
    if ("endTime" in edit)
      return updateItineraryEntryEnd({ ...options, body: edit });
    if ("plannedMinutes" in edit)
      return updateItineraryEntryPlannedLength({ ...options, body: edit });
    return updateItineraryEntryFixedStart({ ...options, body: edit });
  })();
  const { response, error } = await result;
  if (!response?.ok) {
    throw new EntryEditError(
      error?.errorMessage ?? "The itinerary entry change couldn't be saved.",
      isUnconfirmedSave(response),
      error?.moveStartChoices?.offsets
    );
  }
}

export async function saveEntry(
  tripId: number,
  intent: ScheduleAttractionRequest
): Promise<void> {
  const { response, error } = await scheduleAttraction({
    path: { id: tripId },
    body: intent,
    headers: itineraryHeaders,
    signal: AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
  });
  if (!response?.ok) {
    const inputs = error?.schedulingInputs;
    throw new EntrySaveError(
      error?.errorMessage ?? "The attraction couldn't be added.",
      isUnconfirmedSave(response),
      response?.status === 400 && Array.isArray(inputs?.requiredInputs)
        ? inputs
        : undefined
    );
  }
}
