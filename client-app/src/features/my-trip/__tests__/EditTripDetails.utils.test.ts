import { Trip } from "../domain/Trip.types";
import { detectTripChanges } from "../EditTripDetails.utils";

const baseTripFixture: Trip = {
  id: 1,
  name: "Italy",
  startDate: "2026-06-10",
  endDate: "2026-06-24",
  status: "active"
};

test("No changes detected when all fields match the original trip", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "Italy",
    "2026-06-10",
    "2026-06-24"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(false);
});

test("Name change detected when new name differs from original", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "Italy 2026",
    "2026-06-10",
    "2026-06-24"
  );

  expect(result.nameChanged).toBe(true);
  expect(result.datesChanged).toBe(false);
});

test("Name change not detected when only whitespace is added", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "  Italy  ",
    "2026-06-10",
    "2026-06-24"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(false);
});

test("Date change detected when start date differs from original", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "Italy",
    "2026-07-01",
    "2026-06-24"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(true);
});

test("Date change detected when end date differs from original", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "Italy",
    "2026-06-10",
    "2026-07-15"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(true);
});

test("Date change detected when both dates differ from original", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "Italy",
    "2026-07-01",
    "2026-07-15"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(true);
});

test("Both changes detected when name and dates differ from original", () => {
  const result = detectTripChanges(
    baseTripFixture,
    "Italy 2026",
    "2026-07-01",
    "2026-07-15"
  );

  expect(result.nameChanged).toBe(true);
  expect(result.datesChanged).toBe(true);
});

test("Date change detected when original trip has no dates and new dates are provided", () => {
  const tripWithoutDates: Trip = {
    id: 2,
    name: "New Trip",
    status: "active"
  };

  const result = detectTripChanges(
    tripWithoutDates,
    "New Trip",
    "2026-08-01",
    "2026-08-15"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(true);
});

test("No date change detected when original trip has no dates and new dates are empty", () => {
  const tripWithoutDates: Trip = {
    id: 2,
    name: "New Trip",
    status: "active"
  };

  const result = detectTripChanges(tripWithoutDates, "New Trip", "", "");

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(false);
});

test("Date handles ISO string with time portion by comparing only date part", () => {
  const tripWithTimestamp: Trip = {
    id: 3,
    name: "Trip",
    startDate: "2026-06-10T10:00:00.000Z",
    endDate: "2026-06-24T14:30:00.000Z",
    status: "active"
  };

  const result = detectTripChanges(
    tripWithTimestamp,
    "Trip",
    "2026-06-10",
    "2026-06-24"
  );

  expect(result.nameChanged).toBe(false);
  expect(result.datesChanged).toBe(false);
});
