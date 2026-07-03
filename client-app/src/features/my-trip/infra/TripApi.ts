import {
  detachAttraction,
  detachAttraction1,
  getTrip,
  getTrips,
  saveTrip,
  updateTripDetail,
  updateTripRange,
  GetTripResponse,
  TripParameter
} from "../../../clients/manager";
import { client } from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import { LastReadTrip, Rating, Trip, TripStatus } from "../domain/Trip.types";
import { AttractionVisitHistory } from "../domain/VisitHistory.types";
import { chunk } from "../../../shared/utils/chunk";

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
  reviewNote?: string;
  attractionGroup: TripAttractionGroup;
  workingHours?: string;
  visitTime?: string;
  wouldVisitAgain?: boolean;
}

managerClient();

const computeStatus = (
  endDate: string | undefined,
  archived: boolean | undefined
): TripStatus => {
  if (archived) return "archived";
  if (!endDate) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today ? "past" : "active";
};

// Maps a trip DTO from the backend into the domain `Trip`, or `undefined` when
// the payload is missing the fields we require.
const toTrip = (dto: GetTripResponse): Trip | undefined => {
  if (dto.tripId == null || dto.tripName == null) {
    return undefined;
  }
  return {
    id: dto.tripId,
    name: dto.tripName,
    startDate: dto.fromDate,
    endDate: dto.toDate,
    updatedOn: dto.changedOn,
    status: computeStatus(dto.toDate, dto.archived)
  };
};

// Fetches a single page of trips (the page starting after `cursor`) and maps it
// to domain `Trip`s. This is the only function here that talks to the backend.
const fetchTripsPage = async (
  cursor: LastReadTrip | undefined,
  orderBy?: "ASC" | "DESC"
): Promise<Trip[]> => {
  const after: TripParameter = {
    tripId: cursor?.tripId,
    updatedOn: cursor?.updatedOn
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

  return data.map(toTrip).filter((trip): trip is Trip => trip !== undefined);
};

// Pulls every page the backend serves and returns the full list of trips.
//
// The backend serves trips one page at a time (manager.request.page-size), so we
// follow the cursor until a page yields no new trips; otherwise every trip beyond
// the first page (e.g. archived ones) would be silently hidden. De-duplicating by
// id keeps the loop correct even if a page repeats boundary rows.
export const fetchTrips = async (
  lastReadTrip?: LastReadTrip,
  orderBy?: "ASC" | "DESC"
): Promise<Trip[]> => {
  const tripsById = new Map<number, Trip>();
  let cursor: LastReadTrip | undefined = lastReadTrip;
  let hasMorePages = true;

  while (hasMorePages) {
    const page = await fetchTripsPage(cursor, orderBy);

    const sizeBeforePage = tripsById.size;
    for (const trip of page) {
      if (!tripsById.has(trip.id)) {
        tripsById.set(trip.id, trip);
      }
    }

    // Continue only while the page introduced at least one new trip. When the
    // server has nothing new left to hand out, the list is fully loaded.
    const lastTrip = page.at(-1);
    hasMorePages = lastTrip !== undefined && tripsById.size > sizeBeforePage;
    if (lastTrip) {
      cursor = { tripId: lastTrip.id, updatedOn: lastTrip.updatedOn };
    }
  }

  return Array.from(tripsById.values());
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
  const { error } = await detachAttraction({
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

  if (error || !data) {
    return undefined;
  }

  return toTrip(data);
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
  reviewNote?: string
): Promise<void> => {
  const { error } = await client.post({
    url: `/trips/${tripId}/attractions/${attractionId}/review`,
    body: { rating, reviewNote },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    throw new Error("Error while reviewing trip attraction");
  }
};

export const clearTripAttractionReview = async (
  tripId: number,
  attractionId: number
): Promise<void> => {
  const { error } = await client.delete({
    url: `/trips/${tripId}/attractions/${attractionId}/review`,
    headers: { "x-api-version": "1" }
  });

  if (error) {
    throw new Error("Error while clearing attraction review");
  }
};

export const removeAttractionFromTrip = async (
  tripId: number,
  attractionId: number
): Promise<void> => {
  const { error } = await detachAttraction1({
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

export const updateTripAttractionWouldVisitAgain = async (
  tripId: number,
  attractionId: number,
  wouldVisitAgain: boolean
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/would-visit-again`,
    body: { wouldVisitAgain },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating would visit again", error);
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

export const updateTripAttractionNote = async (
  tripId: number,
  attractionId: number,
  note?: string
): Promise<void> => {
  const { error } = await client.put({
    url: `/trips/${tripId}/attractions/${attractionId}/note`,
    body: { note: note || null },
    headers: { "x-api-version": "1", "Content-Type": "application/json" }
  });

  if (error) {
    console.error("Error while updating attraction note", error);
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

export const VISIT_HISTORY_MAX_BATCH_SIZE = 100;

export const fetchAttractionsVisitHistory = async (
  currentTripId: number,
  attractionIds: number[]
): Promise<AttractionVisitHistory[]> => {
  if (attractionIds.length === 0) {
    return [];
  }

  const batches = chunk(attractionIds, VISIT_HISTORY_MAX_BATCH_SIZE);

  const responses = await Promise.all(
    batches.map(async (batch) => {
      const { data, error } = await client.post({
        url: `/trips/${currentTripId}/attractions/visit-history`,
        body: { attractionIds: batch },
        headers: { "x-api-version": "1", "Content-Type": "application/json" }
      });

      if (error) {
        console.error("Error while fetching attractions visit history", error);
        return [] as AttractionVisitHistory[];
      }

      return (data as AttractionVisitHistory[]) ?? [];
    })
  );

  return responses.flat();
};
