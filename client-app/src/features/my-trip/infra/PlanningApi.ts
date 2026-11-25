import { client, type ErrorResponse } from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import {
  isBoardRemoval,
  type TripPlanningChange
} from "../domain/TripPlanning.types";

managerClient();

export const PLANNING_REQUEST_TIMEOUT_MS = 15_000;

export const isUnconfirmedSave = (response?: Response): boolean =>
  !response || response.status === 408 || response.status >= 500;

export class PlanningSaveError extends Error {
  constructor(
    message: string,
    readonly unconfirmed: boolean,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}

export class BoardRemovalConfirmationError extends PlanningSaveError {}

const requestFor = (
  tripId: number,
  change: TripPlanningChange
): { method: "POST" | "PUT" | "DELETE"; url: string; body?: unknown } => {
  const trip = `/trips/${tripId}`;
  switch (change.type) {
    case "dates":
      return {
        method: "PUT",
        url: `${trip}/range`,
        body: { fromDate: change.fromDate, toDate: change.toDate }
      };
    case "attach":
      return {
        method: "POST",
        url: `${trip}/attractions`,
        body: {
          attractionId: change.attractionId,
          attractionGroup: change.attractionGroup
        }
      };
    case "remove":
      return {
        method: "DELETE",
        url: `${trip}/attractions/${change.attractionId}`,
        body: change.confirmedRemoval
      };
    case "arrange":
      return {
        method: "PUT",
        url: `${trip}/board`,
        body: { attractions: change.attractions }
      };
    case "move":
      return {
        method: "PUT",
        url: `${trip}/board/attractions/${change.attractionId}`,
        body: {
          targetGroup: change.targetGroup,
          previousAttractionId: change.previousAttractionId,
          nextAttractionId: change.nextAttractionId,
          confirmedRemoval: change.confirmedRemoval
        }
      };
    default: {
      const { type, attractionId, ...body } = change;
      return {
        method: "PUT",
        url: `${trip}/attractions/${attractionId}/${type}`,
        body
      };
    }
  }
};

export const savePlanningChange = async (
  tripId: number,
  change: TripPlanningChange,
  signal?: AbortSignal
): Promise<void> => {
  const { response, error } = await client.request<
    unknown,
    { error: ErrorResponse }
  >({
    ...requestFor(tripId, change),
    signal,
    headers: {
      "x-api-version": "1",
      "Content-Type": "application/json"
    }
  });
  if (!response || !response.ok) {
    if (
      response?.status === 409 &&
      error?.errorCode === "RESOURCE_HAS_DEPENDENCIES" &&
      isBoardRemoval(change)
    ) {
      if (change.type === "remove" && change.unscheduledOnly) {
        throw new PlanningSaveError(
          "An attraction is now scheduled and was not removed. Keep it in the trip or review the unscheduled attractions again.",
          false
        );
      }
      throw new BoardRemovalConfirmationError(
        error.errorMessage ??
          "Review the itinerary consequences before confirming the board change.",
        false
      );
    }
    const unconfirmed = isUnconfirmedSave(response);
    throw new PlanningSaveError(
      error?.errorMessage ??
        (unconfirmed
          ? "The save couldn't be confirmed. Reload saved planning before trying again."
          : "The planning change was rejected. Review it before trying again."),
      unconfirmed,
      { cause: error }
    );
  }
};
