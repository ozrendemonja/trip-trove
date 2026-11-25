import { useCallback, useContext, useState } from "react";
import type { GetItineraryResponse } from "../../../clients/manager";
import type { ConfirmedItineraryRemoval } from "../../my-trip/domain/TripPlanning.types";
import { fetchTripItinerary } from "../../my-trip/infra/TripApi";
import {
  TripPlanningWorkspace,
  usePlanningDraft,
  usePlanningReads
} from "../../my-trip/useTripPlanningWorkspace";

type Day = GetItineraryResponse["days"][number];
type Entry = Day["entries"][number];

export interface BoardRemovalSelection {
  attractionIds: number[];
  entry?: { dayNumber: number; saved: Entry; endDayNumber: number };
}

interface BoardRemovalProposal {
  operation: "remove" | "exclude" | "city";
  name: string;
  attractionIds: number[];
  reviewAgain?: boolean;
  draftOnly?: boolean;
  apply: (selection: BoardRemovalSelection) => void;
}

export type BoardRemovalPreview = { proposal: BoardRemovalProposal } & (
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; selection: BoardRemovalSelection }
);

export function confirmedRemoval({
  entry
}: BoardRemovalSelection): ConfirmedItineraryRemoval | undefined {
  if (!entry) return undefined;
  return { entryId: entry.saved.entryId };
}

function selectionFor(
  proposal: BoardRemovalProposal,
  days: Day[]
): BoardRemovalSelection {
  if (proposal.operation === "city") {
    const scheduled = new Set(
      days.flatMap((day) => day.entries.map((entry) => entry.attractionId))
    );
    return {
      attractionIds: proposal.attractionIds.filter((id) => !scheduled.has(id))
    };
  }
  const [id] = proposal.attractionIds;
  for (const [index, day] of days.entries()) {
    const saved = day.entries.find((entry) => entry.attractionId === id);
    if (saved) {
      const endDate = saved.timing.end.slice(0, 10);
      return {
        attractionIds: proposal.attractionIds,
        entry: {
          dayNumber: index + 1,
          saved,
          endDayNumber: days.findIndex(({ date }) => date === endDate) + 1
        }
      };
    }
  }
  return { attractionIds: proposal.attractionIds };
}

export function useBoardRemovalPreview(tripId: number | undefined): {
  preview: BoardRemovalPreview | undefined;
  open: (proposal: BoardRemovalProposal) => void;
  close: () => void;
} {
  const workspace = useContext(TripPlanningWorkspace);
  const [preview, setPreview] = useState<BoardRemovalPreview>();
  const { start, cancel } = usePlanningReads(tripId, workspace);
  const close = useCallback(() => {
    cancel();
    setPreview(undefined);
  }, [cancel]);
  usePlanningDraft(preview !== undefined, close);

  const open = useCallback(
    (proposal: BoardRemovalProposal): void => {
      if (tripId === undefined || proposal.draftOnly) {
        setPreview({
          proposal,
          state: "ready",
          selection: selectionFor(proposal, [])
        });
        return;
      }
      const request = start();
      setPreview({ proposal, state: "loading" });
      void fetchTripItinerary(tripId, request.signal).then(
        ({ days }) => {
          if (!request.isLatest()) return;
          if (!request.isCurrent()) {
            setPreview({
              proposal,
              state: "error",
              message:
                "Planning changed while loading. Reload the itinerary preview."
            });
            return;
          }
          const selection = selectionFor(proposal, days);
          if (
            proposal.operation === "exclude" &&
            !selection.entry &&
            !proposal.reviewAgain
          ) {
            close();
            proposal.apply(selection);
            return;
          }
          setPreview({ proposal, state: "ready", selection });
        },
        () => {
          if (!request.isLatest()) return;
          setPreview({
            proposal,
            state: "error",
            message: "The itinerary couldn't be loaded. No changes were made."
          });
        }
      );
    },
    [close, start, tripId]
  );
  return { preview, open, close };
}
