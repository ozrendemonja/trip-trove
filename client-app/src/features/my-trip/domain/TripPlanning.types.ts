import type { ItineraryRemovalRequest } from "../../../clients/manager";

export type TripAttractionGroup = "PRIMARY" | "SECONDARY" | "EXCLUDED";

export interface TripBoardItem {
  attractionId: number;
  group: TripAttractionGroup;
}

export type ItineraryRemoval = ItineraryRemovalRequest;

export type TripPlanningChange =
  | { type: "dates"; fromDate: string; toDate: string }
  | {
      type: "attach";
      attractionId: number;
      attractionGroup: TripAttractionGroup;
    }
  | {
      type: "remove";
      attractionId: number;
      itineraryRemoval?: ItineraryRemoval;
      unscheduledOnly?: true;
    }
  | { type: "arrange"; attractions: TripBoardItem[] }
  | {
      type: "move";
      attractionId: number;
      targetGroup: TripAttractionGroup;
      previousAttractionId: number | null;
      nextAttractionId: number | null;
      itineraryRemoval?: ItineraryRemoval;
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

export type BoardRemovalChange =
  | Extract<TripPlanningChange, { type: "remove" }>
  | (Extract<TripPlanningChange, { type: "move" }> & {
      targetGroup: "EXCLUDED";
    });

export function isBoardRemoval(
  change: TripPlanningChange | undefined
): change is BoardRemovalChange {
  return (
    change?.type === "remove" ||
    (change?.type === "move" && change.targetGroup === "EXCLUDED")
  );
}
