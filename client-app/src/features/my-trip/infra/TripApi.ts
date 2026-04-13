import {
  detachAttraction1,
  getTrip,
  getTrips,
  saveTrip,
  updateTripDetail,
  updateTripRange,
  TripParameter
} from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import { LastReadTrip, Trip, TripStatus } from "../domain/Trip.types";

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
