import {
  scheduleAttraction,
  updateItineraryEntryEnd,
  updateItineraryEntryFixedStart,
  updateItineraryEntryPlannedLength,
  updateItineraryEntryStart,
  type ErrorResponse,
  type ScheduleAttractionRequest,
  type UpdateItineraryEntryEndRequest,
  type UpdateItineraryEntryFixedStartRequest,
  type UpdateItineraryEntryPlannedLengthRequest,
  type UpdateItineraryEntryStartRequest
} from "../../../clients/manager";
import { PlanningSaveError } from "./PlanningApi";

const itineraryHeaders = { "x-api-version": "1" } as const;
const requestTimeoutMs = 15_000;

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

export async function saveTimingEdit(
  tripId: number,
  entryId: number,
  body: TimingEdit
): Promise<void> {
  const options = {
    path: { id: tripId, entryId },
    headers: itineraryHeaders,
    signal: AbortSignal.timeout(requestTimeoutMs)
  };
  const result =
    "startTime" in body
      ? updateItineraryEntryStart({ ...options, body })
      : "endTime" in body
        ? updateItineraryEntryEnd({ ...options, body })
        : "plannedMinutes" in body
          ? updateItineraryEntryPlannedLength({ ...options, body })
          : updateItineraryEntryFixedStart({ ...options, body });
  const { response, error } = await result;
  if (!response?.ok) {
    throw new PlanningSaveError(
      error?.errorMessage ?? "The itinerary entry change couldn't be saved.",
      !response || response.status >= 500,
      { cause: error }
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
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  if (!response?.ok) {
    const inputs = error?.schedulingInputs;
    throw new EntrySaveError(
      error?.errorMessage ?? "The attraction couldn't be added.",
      !response || response.status >= 500,
      response?.status === 400 && Array.isArray(inputs?.requiredInputs)
        ? inputs
        : undefined
    );
  }
}
