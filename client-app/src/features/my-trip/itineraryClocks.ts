import type { EntryEdit, TimingEdit } from "./infra/ItinerarySchedulingApi";

export type TimingField = "start" | "end" | "length";

type ClockEdit =
  | { field: "start"; clock: string }
  | { field: "end"; clock: string; date: string }
  | { field: "length"; minutes: number };

export function clockEditInput(edit: EntryEdit): ClockEdit | undefined {
  if ("startTime" in edit) return { field: "start", clock: edit.startTime };
  if ("endTime" in edit)
    return { field: "end", clock: edit.endTime, date: edit.endDate };
  if ("plannedMinutes" in edit)
    return { field: "length", minutes: edit.plannedMinutes };
}

const offsetPattern = /([+-]\d\d:\d\d(?::\d\d)?|Z)$/;
const clockPattern = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const datedClockPattern = /^(\d{4}-\d{2}-\d{2})\s+(.+)$/;

export const isLocalClock = (value: string): boolean =>
  clockPattern.test(value);

export const clockOffset = (clock: string): string =>
  clock.match(offsetPattern)?.[0] ?? "";

export const localClock = (dateTime: string): string =>
  dateTime.slice(11).replace(offsetPattern, "");

function instant(dateTime: string): number {
  const offset = clockOffset(dateTime);
  // Some historic zone offsets have seconds, which Date.parse does not accept.
  return offset.length === 9
    ? Date.parse(dateTime.slice(0, -3)) -
        (offset.startsWith("-") ? -1 : 1) * Number(offset.slice(-2)) * 1000
    : Date.parse(dateTime);
}

export const elapsedMinutes = (from: string, to: string): number =>
  (instant(to) - instant(from)) / 60_000;

export function freeTimeLabel(minutes: number): string {
  const wholeMinutes = Math.floor(minutes);
  if (wholeMinutes < 1) return "<1m free";
  const hours = Math.floor(wholeMinutes / 60);
  const remaining = wholeMinutes % 60;
  const length = [hours ? `${hours}h` : "", remaining ? `${remaining}m` : ""]
    .filter(Boolean)
    .join(" ");
  return `${length} free`;
}

export function parseTimingEdit(
  field: TimingField,
  text: string,
  displayedEndDate: string
): TimingEdit | string {
  const value = text.trim();
  if (field === "length") {
    const minutes = Number(value);
    return /^\d+$/.test(value) && minutes <= 2_147_483_647
      ? { plannedMinutes: minutes }
      : "Enter a planned length in whole minutes (0 for a brief stop).";
  }
  if (field === "start") {
    return isLocalClock(value)
      ? { startTime: value }
      : "Enter a start clock in HH:mm format.";
  }

  const datedClock = value.match(datedClockPattern);
  const endTime = datedClock?.[2] ?? value;
  return isLocalClock(endTime)
    ? { endTime, endDate: datedClock?.[1] ?? displayedEndDate }
    : "Enter an end clock as HH:mm, or YYYY-MM-DD HH:mm for another date.";
}
