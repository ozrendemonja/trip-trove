import { elapsedMinutes, parseTimingEdit } from "../itineraryClocks";

describe("elapsed timing for saved timeline display", () => {
  it.each([
    ["2027-03-28T01:45+01:00", "2027-03-28T03:15+02:00", 30],
    ["2027-10-31T02:30+02:00", "2027-10-31T02:30+01:00", 60],
    ["2027-03-29T23:00+02:00", "2027-03-30T01:00+02:00", 120],
    ["1971-01-01T09:00-00:44:30", "1971-01-01T10:14:30Z", 30]
  ])("derives whole elapsed minutes from %s to %s", (start, end, minutes) => {
    expect(elapsedMinutes(start, end)).toBe(minutes);
  });
});

describe("duration and clock input", () => {
  it("uses the displayed end date unless the user supplies another", () => {
    expect(parseTimingEdit("end", "01:00", "2027-03-29")).toEqual({
      endTime: "01:00",
      endDate: "2027-03-29"
    });
    expect(parseTimingEdit("end", "2027-03-30 01:00", "2027-03-29")).toEqual({
      endTime: "01:00",
      endDate: "2027-03-30"
    });
  });

  it("distinguishes an explicit brief stop from an incomplete length", () => {
    expect(parseTimingEdit("length", "0", "2027-03-29")).toEqual({
      plannedMinutes: 0
    });
    expect(parseTimingEdit("length", "", "2027-03-29")).toMatch(
      /whole minutes/
    );
  });
});
