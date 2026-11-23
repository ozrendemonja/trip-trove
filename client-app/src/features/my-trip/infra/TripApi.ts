import {
  detachAttraction,
  getItinerary,
  getTrip,
  getTrips,
  saveTrip,
  updateTripDetail,
  type GetItineraryResponse,
  GetTripResponse
} from "../../../clients/manager";
import { client } from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import { LastReadTrip, Rating, Trip, TripStatus } from "../domain/Trip.types";
import { AttractionVisitHistory } from "../domain/VisitHistory.types";
import { chunk } from "../../../shared/utils/chunk";
import type { TripAttractionGroup } from "../domain/TripPlanning.types";

export type {
  TripAttractionGroup,
  TripBoardItem
} from "../domain/TripPlanning.types";

export type TripAttractionStatus = "PLANNED" | "VISITED";
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

export const isTripPast = (endDate: string | undefined): boolean => {
  if (!endDate) return false;
  const today = new Date();
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  // Date-only trip bounds use the local calendar, not UTC instants.
  return endDate < todayDate;
};

const computeStatus = (
  endDate: string | undefined,
  archived: boolean | undefined
): TripStatus => {
  if (archived) return "archived";
  return isTripPast(endDate) ? "past" : "active";
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
  const { data, error } = await getTrips({
    headers: { "x-api-version": "1" },
    query: {
      sd: orderBy,
      tripId: cursor?.tripId,
      updatedOn: cursor?.updatedOn
    }
  });

  if (error) {
    throw new Error("Error while getting trips", { cause: error });
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

export const fetchTripsContainingDate = async (
  date: string
): Promise<Trip[]> => {
  const { data, error } = await client.get<GetTripResponse[]>({
    url: "/trips",
    headers: { "x-api-version": "1" },
    query: { date }
  });

  if (error) {
    throw new Error("Error while finding trips for date", { cause: error });
  }

  return (data ?? [])
    .map(toTrip)
    .filter((trip): trip is Trip => trip !== undefined);
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
    throw new Error("Error while saving trip", { cause: error });
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

export const fetchTripById = async (
  id: number
): Promise<Trip & { hasItineraryEntries: boolean }> => {
  const { data, error } = await getTrip({
    path: { id },
    headers: { "x-api-version": "1" }
  });

  if (error || !data) {
    throw new Error("The trip couldn't be loaded.", { cause: error });
  }

  const trip = toTrip(data);
  if (!trip) {
    throw new Error("The server returned incomplete trip details.");
  }
  return { ...trip, hasItineraryEntries: data.hasItineraryEntries === true };
};

const isSavedItinerary = (
  data: GetItineraryResponse | undefined,
  id: number
): data is GetItineraryResponse =>
  data?.tripId === id &&
  Array.isArray(data.days) &&
  data.days.length > 0 &&
  data.days.every((day) => Array.isArray(day.entries)) &&
  Array.isArray(data.unscheduledAttractions);

export const fetchTripItinerary = async (
  id: number,
  signal: AbortSignal
): Promise<GetItineraryResponse> => {
  const { data, error } = await getItinerary({
    path: { id },
    headers: { "x-api-version": "1" },
    signal,
    cache: "no-store"
  });
  if (error || !isSavedItinerary(data, id)) {
    throw new Error("The itinerary couldn't be loaded.", { cause: error });
  }
  return data;
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
    throw new Error("Error while updating trip name", { cause: error });
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

export const fetchTripBoard = async (
  tripId: number
): Promise<TripAttractionFromServer[]> => {
  const { data, error } = await client.get<TripAttractionFromServer[]>({
    url: `/trips/${tripId}/attractions`,
    headers: { "x-api-version": "1" }
  });
  if (error || !data) {
    throw new Error("The trip's current planning couldn't be loaded.", {
      cause: error
    });
  }
  return data;
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
