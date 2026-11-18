export type TripAttractionGroup = "PRIMARY" | "SECONDARY" | "EXCLUDED";

export interface TripBoardItem {
  attractionId: number;
  group: TripAttractionGroup;
}

export type TripPlanningChange =
  | { type: "dates"; fromDate: string; toDate: string }
  | {
      type: "attach";
      attractionId: number;
      attractionGroup: TripAttractionGroup;
    }
  | { type: "remove"; attractionId: number }
  | { type: "arrange"; attractions: TripBoardItem[] }
  | {
      type: "move";
      attractionId: number;
      targetGroup: TripAttractionGroup;
      previousAttractionId: number | null;
      nextAttractionId: number | null;
    }
  | {
      type: "must-visit";
      attractionId: number;
      mustVisit: boolean;
    }
  | {
      type: "working-hours";
      attractionId: number;
      workingHours: string | null;
    }
  | { type: "visit-time"; attractionId: number; visitTime: string | null }
  | { type: "note"; attractionId: number; note: string | null };
