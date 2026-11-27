import {
  addItineraryItem,
  extractGroupedAttraction,
  joinItineraryAttraction,
  moveGroupedAttraction,
  moveItineraryEntry,
  removeGroupedAttraction,
  removeItineraryEntry,
  removeItineraryTransfer,
  reorderGroupedAttractions,
  scheduleAttraction,
  updateItineraryDayNote,
  updateItineraryEntryEnd,
  updateItineraryEntryFixedStart,
  updateItineraryEntryPlannedLength,
  updateItineraryEntryStart,
  updateItineraryItem,
  updateItineraryTransfer,
  type AddItineraryItemRequest,
  type ErrorResponse,
  type ExtractGroupedAttractionRequest,
  type ItineraryItemFields,
  type JoinItineraryAttractionRequest,
  type MoveItineraryEntryRequest,
  type RemoveItineraryEntryRequest,
  type ReorderGroupedAttractionsRequest,
  type ScheduleAttractionRequest,
  type UpdateItineraryEntryEndRequest,
  type UpdateItineraryEntryFixedStartRequest,
  type UpdateItineraryEntryPlannedLengthRequest,
  type UpdateItineraryEntryStartRequest,
  type UpdateItineraryTransferRequest
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
    readonly schedulingInputs: ErrorResponse["schedulingInputs"],
    readonly transfersToRemove: ErrorResponse["transfersToRemove"]
  ) {
    super(message, unconfirmed);
  }
}

export type TimingEdit =
  | UpdateItineraryEntryStartRequest
  | UpdateItineraryEntryEndRequest
  | UpdateItineraryEntryPlannedLengthRequest
  | UpdateItineraryEntryFixedStartRequest;

export type GroupMemberEdit =
  | {
      action: "extract-group-member";
      attractionId: number;
      request: ExtractGroupedAttractionRequest;
    }
  | {
      action: "move-group-member";
      attractionId: number;
      destinationEntryId: number;
    }
  | { action: "remove-group-member"; attractionId: number };

export type AddItemEdit = {
  action: "add-item";
  request: AddItineraryItemRequest;
  previousEntryIds: ReadonlySet<number>;
};

export type EntryEdit =
  | TimingEdit
  | GroupMemberEdit
  | { action: "join"; request: JoinItineraryAttractionRequest }
  | { action: "reorder-group"; request: ReorderGroupedAttractionsRequest }
  | { action: "move"; position: MoveItineraryEntryRequest }
  | { action: "remove"; removal?: RemoveItineraryEntryRequest }
  | { action: "edit-item"; request: ItineraryItemFields }
  | {
      action: "transfer";
      toEntryId: number;
      transfer?: UpdateItineraryTransferRequest;
    };

export class EntryEditError extends PlanningSaveError {
  constructor(
    message: string,
    unconfirmed: boolean,
    readonly moveOffsets?: string[],
    readonly transfersToRemove?: ErrorResponse["transfersToRemove"],
    readonly schedulingInputs?: ErrorResponse["schedulingInputs"],
    readonly maximumPlannedMinutes?: number
  ) {
    super(message, unconfirmed);
  }
}

function requireEntryEditSuccess(
  response: Response | undefined,
  error: ErrorResponse | undefined
): void {
  if (!response?.ok) {
    throw new EntryEditError(
      error?.errorMessage ?? "The itinerary entry change couldn't be saved.",
      isUnconfirmedSave(response),
      error?.moveStartChoices?.offsets,
      error?.transfersToRemove,
      error?.schedulingInputs,
      error?.maximumPlannedMinutes
    );
  }
}

export async function saveItemAddition(
  tripId: number,
  request: AddItineraryItemRequest
): Promise<void> {
  const { response, error } = await addItineraryItem({
    path: { tripId },
    headers: itineraryHeaders,
    body: request,
    signal: AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
  });
  requireEntryEditSuccess(response, error);
}

export async function saveEntryEdit(
  tripId: number,
  entryId: number,
  edit: EntryEdit
): Promise<void> {
  const options = {
    path: { tripId, entryId },
    headers: itineraryHeaders,
    signal: AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
  };
  const result = (() => {
    if ("action" in edit) {
      switch (edit.action) {
        case "join":
          return joinItineraryAttraction({
            ...options,
            path: { tripId, hostEntryId: entryId },
            body: edit.request
          });
        case "reorder-group":
          return reorderGroupedAttractions({
            ...options,
            path: { tripId, hostEntryId: entryId },
            body: edit.request
          });
        case "extract-group-member":
        case "move-group-member":
        case "remove-group-member": {
          const memberOptions = {
            ...options,
            path: {
              tripId,
              hostEntryId: entryId,
              attractionId: edit.attractionId
            }
          };
          if (edit.action === "extract-group-member")
            return extractGroupedAttraction({
              ...memberOptions,
              body: edit.request
            });
          if (edit.action === "move-group-member")
            return moveGroupedAttraction({
              ...memberOptions,
              path: {
                ...memberOptions.path,
                destinationEntryId: edit.destinationEntryId
              }
            });
          return removeGroupedAttraction(memberOptions);
        }
        case "move":
          return moveItineraryEntry({ ...options, body: edit.position });
        case "remove":
          return removeItineraryEntry({ ...options, body: edit.removal });
        case "edit-item":
          return updateItineraryItem({ ...options, body: edit.request });
        case "transfer": {
          const transferOptions = {
            ...options,
            path: {
              tripId,
              fromEntryId: entryId,
              toEntryId: edit.toEntryId
            }
          };
          return edit.transfer
            ? updateItineraryTransfer({
                ...transferOptions,
                body: edit.transfer
              })
            : removeItineraryTransfer(transferOptions);
        }
      }
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
  requireEntryEditSuccess(response, error);
}

export async function saveEntry(
  tripId: number,
  intent: ScheduleAttractionRequest
): Promise<void> {
  const { response, error } = await scheduleAttraction({
    path: { tripId },
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
        : undefined,
      error?.transfersToRemove
    );
  }
}
