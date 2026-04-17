import {
  attachAttraction,
  detachAttraction,
  detachAttraction1,
  getTrip,
  getTrips,
  saveTrip,
  updateTripDetail,
  updateTripRange,
  TripParameter
} from "../../../clients/manager";
import { client } from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import { LastReadTrip, Rating, Trip, TripStatus } from "../domain/Trip.types";

export type TripAttractionStatus = "PLANNED" | "VISITED";
export type TripAttractionGroup = "PRIMARY" | "SECONDARY" | "EXCLUDED";

export interface TripAttractionFromServer {
  attractionId: number;
  attractionName: string;
  cityName?: string;
  regionName: string;
  countryName: string;
  isCountrywide: boolean;
  mainAttractionName?: string;
  attractionAddress?: string;
  attractionCategory: string;
  attractionType: string;
  mustVisit: boolean;
  isTraditional: boolean;
  tip?: string;
  infoFrom: string;
  infoRecorded?: string;
  optimalVisitPeriod?: { fromDate: string; toDate: string };
  status: TripAttractionStatus;
  rating?: string;
  note?: string;
  attractionGroup?: TripAttractionGroup;
  planNote?: string;
  workingHours?: string;
  visitTime?: string;
}

managerClient();

const computeStatus = (endDate: string): TripStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today ? "past" : "active";
};

export const fetchTrips = async (
  lastReadTrip?: LastReadTrip,
  orderBy?: "ASC" | "DESC"
): Promise<Trip[]> => {
  const after: TripParameter = {
    tripId: lastReadTrip?.tripId,
    updatedOn: lastReadTrip?.updatedOn
  };

  const { data, error } = await getTrips({
    headers: { "x-api-version": "1" },
    query: { after, sd: orderBy }
  });

  if (error) {
    throw new Error("Error while getting trips", error);
  }
  if (!data) {
    throw new Error("Invalid trip data");
  }

  return data
    .filter((t) => t.tripId != null && t.tripName != null)
    .map((t) => ({
      id: t.tripId!,
      name: t.tripName!,
      startDate: t.fromDate,
      endDate: t.toDate,
      updatedOn: t.changedOn,
      status: t.toDate ? computeStatus(t.toDate) : "active"
    }));
};

export const saveTripToApi = async (
  name: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const { error } = await saveTrip({
    body: {
      tripName: name,
      fromDate: startDate,
      toDate: endDate
    },
    headers: { "x-api-version": "1" }
  });

  if (error) {
    throw new Error("Error while saving trip", error);
  }
};

export const deleteTripById = async (id: number): Promise<void> => {
  const { error } = await detachAttraction1({
    path: { id },
    headers: { "x-api-version": "1" }
  });

  if (error) {
    throw new Error("Error while deleting trip", error);
  }
};

export const fetchTripById = async (id: number): Promise<Trip | undefined> => {
  const { data, error } = await getTrip({
    path: { id },
    headers: { "x-api-version": "1" }
  });

  if (error || !data?.tripId || !data.tripName) {
    return undefined;
  }

  return {
    id: data.tripId,
    name: data.tripName,
    startDate: data.fromDate,
    endDate: data.toDate,
    updatedOn: data.changedOn,
    status: data.toDate ? computeStatus(data.toDate) : "active"
  };
};

export const updateTripName = async (
  id: number,
  name: string
): Promise<void> => {
  const { error } = await updateTripDetail({
    path: { id },
    body: { tripName: name },
    headers: { "x-api-version": "1" }
  });

  if (error) {
    throw new Error("Error while updating trip name", error);
  }
};

export const updateTripDates = async (
  id: number,
  startDate: string,
  endDate: string
): Promise<void> => {
  const { error } = await updateTripRange({
    path: { id },
    body: { fromDate: startDate, toDate: endDate },
    headers: { "x-api-version": "1" }
  });

  if (error) {
    throw new Error("Error while updating trip dates", error);
  }
};

export const attachAttractionToTrip = async (
  tripId: number,
  attractionId: number,
  attractionGroup?: TripAttractionGroup
): Promise<void> => {
  const { error } = await client.post({
    url: `/trips/${tripId}/attractions`,
    body: { attractionId, attractionGroup },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while attaching attraction to trip", error);
  }
};

export const updateTripAttraction = async (
  tripId: number,
  attractionId: number,
  rating: Rating,
  note?: string
): Promise<void> => {
  const { error } = await client.post({
    url: `/trips/${tripId}/attractions/${attractionId}/review`,
    body: { rating, note },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while reviewing trip attraction", error);
  }
};

export const removeAttractionFromTrip = async (
  tripId: number,
  attractionId: number
): Promise<void> => {
  const { error } = await detachAttraction({
    path: { id: tripId, attractionId },
    headers: { "x-api-version": "1" }
  });

  if (error) {
    throw new Error("Error while removing attraction from trip", error);
  }
};

export const updateAttractionGroup = async (
  tripId: number,
  attractionId: number,
  attractionGroup: TripAttractionGroup
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/group`,
    body: { attractionGroup },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating attraction group", error);
  }
};

export const updateTripAttractionMustVisit = async (
  tripId: number,
  attractionId: number,
  mustVisit: boolean
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/must-visit`,
    body: { mustVisit },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating attraction must visit", error);
  }
};

export const updateTripAttractionWorkingHours = async (
  tripId: number,
  attractionId: number,
  workingHours?: string
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/working-hours`,
    body: { workingHours: workingHours || null },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating attraction working hours", error);
  }
};

export const updateTripAttractionVisitTime = async (
  tripId: number,
  attractionId: number,
  visitTime?: string
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/visit-time`,
    body: { visitTime: visitTime || null },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating attraction visit time", error);
  }
};

export const updateTripAttractionPlanNote = async (
  tripId: number,
  attractionId: number,
  planNote?: string
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/plan-note`,
    body: { planNote: planNote || null },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating attraction plan note", error);
  }
};

export const fetchTripAttractions = async (
  tripId: number
): Promise<TripAttractionFromServer[]> => {
  const { data, error } = await client.get({
    url: `/trips/${tripId}/attractions`,
    headers: { "x-api-version": "1" }
  });

  if (error) {
    console.error("Error while fetching trip attractions", error);
    return [];
  }

  return (data as TripAttractionFromServer[]) ?? [];
};
