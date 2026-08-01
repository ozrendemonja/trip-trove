import type { VisitHistoryEntry } from "../../../my-trip/domain/VisitHistory.types";
import type { Attraction } from "../../components/AttractionList.types";
import type { TouristDestination } from "../../components/Board.types";
import {
  applyVisitHistoryToCities,
  pickColumnForAttraction,
  setPermanentClosureInCities
} from "../Mapper";

const closedAttraction: Attraction = {
  id: 42,
  mustVisit: true,
  stable: true,
  isTraditional: false,
  isCountrywide: false,
  permanentlyClosedAt: "2026-07-31T00:00:00.000Z",
  name: "Old City Observatory",
  address: "",
  category: "POINT_OF_INTEREST_AND_LANDMARK",
  infoFrom: "",
  note: "",
  VisitTime: ""
};

describe("permanently closed attraction placement", () => {
  test("overrides a would-visit-again preference", () => {
    const visits = [{ wouldVisitAgain: true }] as VisitHistoryEntry[];

    expect(pickColumnForAttraction(closedAttraction, visits)).toBe("excluded");
  });

  test("moves a closed attraction to the excluded column without visit history", () => {
    const cities: TouristDestination[] = [
      {
        name: "Belgrade",
        columns: [
          {
            id: "belgrade_top",
            title: "Top Attractions",
            tasks: [closedAttraction]
          },
          {
            id: "belgrade_secondary",
            title: "Secondary Spots",
            tasks: []
          },
          {
            id: "belgrade_excluded",
            title: "Excluded Attractions",
            tasks: []
          }
        ]
      }
    ];

    const result = applyVisitHistoryToCities(cities, undefined);

    expect(result[0].columns[0].tasks).toHaveLength(0);
    expect(result[0].columns[2].tasks).toEqual([closedAttraction]);
  });

  test("restores a reopened attraction to its suggested column", () => {
    const cities: TouristDestination[] = [
      {
        name: "Belgrade",
        columns: [
          { id: "belgrade_top", title: "Top Attractions", tasks: [] },
          {
            id: "belgrade_secondary",
            title: "Secondary Spots",
            tasks: []
          },
          {
            id: "belgrade_excluded",
            title: "Excluded Attractions",
            tasks: [closedAttraction]
          }
        ]
      }
    ];

    const result = setPermanentClosureInCities(
      cities,
      closedAttraction.id,
      undefined,
      undefined
    );

    expect(result[0].columns[0].tasks).toEqual([
      { ...closedAttraction, permanentlyClosedAt: undefined }
    ]);
    expect(result[0].columns[2].tasks).toHaveLength(0);
  });
});
