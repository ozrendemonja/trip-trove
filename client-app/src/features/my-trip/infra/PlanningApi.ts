import { client, type ErrorResponse } from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import type { TripPlanningChange } from "../domain/TripPlanning.types";

managerClient();

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
        url: `${trip}/attractions/${change.attractionId}`
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
          nextAttractionId: change.nextAttractionId
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
  change: TripPlanningChange
): Promise<void> => {
  const { response, error } = await client.request<
    unknown,
    { error: ErrorResponse }
  >({
    ...requestFor(tripId, change),
    headers: {
      "x-api-version": "1",
      "Content-Type": "application/json"
    }
  });
  if (!response || !response.ok) {
    throw new Error(
      error?.errorMessage ??
        "The save couldn't be confirmed. Reload saved planning before trying again.",
      { cause: error }
    );
  }
};
