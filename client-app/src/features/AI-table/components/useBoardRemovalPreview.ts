import { useCallback, useContext, useState } from "react";
import type {
  GetItineraryResponse,
  ItineraryTransferDto,
  ItineraryTransferRemovalResponse
} from "../../../clients/manager";
import type { ItineraryRemoval } from "../../my-trip/domain/TripPlanning.types";
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
  entry?: {
    dayNumber: number;
    saved: Entry;
    endDayNumber: number;
    transfers: ItineraryTransferRemovalResponse[];
  };
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

export function itineraryRemovalFor({
  entry
}: BoardRemovalSelection): ItineraryRemoval | undefined {
  if (!entry) return undefined;
  return {
    entryId: entry.saved.entryId,
    ...(entry.transfers.length && {
      transfersToRemove: entry.transfers.map(({ transfer }) => transfer)
    })
  };
}

export const transferPairKey = ({
  fromEntryId,
  toEntryId
}: ItineraryTransferDto): string => `${fromEntryId}:${toEntryId}`;

export function excludingDisconnectedTransfers(
  itineraryRemoval: ItineraryRemoval | undefined,
  disconnected: ReadonlySet<string>
): ItineraryRemoval | undefined {
  const transfers = itineraryRemoval?.transfersToRemove;
  if (!itineraryRemoval || !transfers) return itineraryRemoval;
  const remaining = transfers.filter(
    (transfer) => !disconnected.has(transferPairKey(transfer))
  );
  return remaining.length === transfers.length
    ? itineraryRemoval
    : { entryId: itineraryRemoval.entryId, transfersToRemove: remaining };
}

function transferConsequences(
  entries: Entry[],
  index: number
): ItineraryTransferRemovalResponse[] {
  const fromAndTo = [
    [entries[index - 1], entries[index]],
    [entries[index], entries[index + 1]]
  ];
  return fromAndTo.flatMap(([from, to]) => {
    const transfer = from?.outgoingTransfer;
    return transfer && to && transfer.toEntryId === to.entryId
      ? [{ transfer, fromName: from.name, toName: to.name }]
      : [];
  });
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
    const position = day.entries.findIndex(
      (entry) => entry.attractionId === id
    );
    const saved = day.entries[position];
    if (saved) {
      const endDate = saved.timing.end.slice(0, 10);
      return {
        attractionIds: proposal.attractionIds,
        entry: {
          dayNumber: index + 1,
          saved,
          endDayNumber: days.findIndex(({ date }) => date === endDate) + 1,
          transfers: transferConsequences(day.entries, position)
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
