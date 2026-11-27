import { useCallback, useContext, useState } from "react";
import type {
  AttractionEntry,
  GetItineraryResponse,
  ItineraryTransferDto,
  ItineraryTransferRemovalResponse
} from "../../../clients/manager";
import type {
  BoardRemovalChange,
  ItineraryRemoval
} from "../../my-trip/domain/TripPlanning.types";
import { fetchTripItinerary } from "../../my-trip/infra/TripApi";
import type { GroupedAttraction } from "../../my-trip/ItineraryDrag";
import { transfersForEntryRemoval } from "../../my-trip/ItineraryTransfer";
import { isAttractionEntry } from "../../my-trip/itineraryEntries";
import {
  TripPlanningWorkspace,
  usePlanningDraft,
  usePlanningReads
} from "../../my-trip/useTripPlanningWorkspace";

type Day = GetItineraryResponse["days"][number];

export interface BoardRemovalSelection {
  attractionIds: number[];
  entry?: {
    dayNumber: number;
    saved: AttractionEntry;
    member?: GroupedAttraction;
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
    ...(!entry.member &&
      !!entry.saved.groupedAttractions?.length && {
        groupedAttractionIdsToRemove: entry.saved.groupedAttractions.map(
          ({ attractionId }) => attractionId
        )
      }),
    ...(entry.transfers.length && {
      transfersToRemove: entry.transfers.map(({ transfer }) => transfer)
    })
  };
}

const transferPairKey = ({
  fromEntryId,
  toEntryId
}: ItineraryTransferDto): string => `${fromEntryId}:${toEntryId}`;

export function remainingItineraryRemoval(
  attractionId: number,
  pending: ItineraryRemoval | undefined,
  earlier: BoardRemovalChange
): ItineraryRemoval | undefined {
  const { itineraryRemoval: completed } = earlier;
  if (!pending || !completed) return pending;
  const sameEntry = pending.entryId === completed.entryId;
  if (
    sameEntry &&
    completed.groupedAttractionIdsToRemove?.includes(attractionId)
  ) {
    return undefined;
  }
  const members = pending.groupedAttractionIdsToRemove;
  const afterGroupChange =
    sameEntry && members?.includes(earlier.attractionId)
      ? {
          ...pending,
          groupedAttractionIdsToRemove: members.filter(
            (id) => id !== earlier.attractionId
          )
        }
      : pending;
  const transfers = pending.transfersToRemove;
  const removedTransfers = completed.transfersToRemove;
  if (!transfers?.length || !removedTransfers?.length) return afterGroupChange;
  const disconnected = new Set(removedTransfers.map(transferPairKey));
  const remainingTransfers = transfers.filter(
    (transfer) => !disconnected.has(transferPairKey(transfer))
  );
  return remainingTransfers.length === transfers.length
    ? afterGroupChange
    : { ...afterGroupChange, transfersToRemove: remainingTransfers };
}

function selectionFor(
  proposal: BoardRemovalProposal,
  days: Day[]
): BoardRemovalSelection {
  if (proposal.operation === "city") {
    const scheduled = new Set(
      days.flatMap((day) =>
        day.entries
          .filter(isAttractionEntry)
          .flatMap((entry) => [
            entry.attractionId,
            ...(entry.groupedAttractions?.map(
              (member) => member.attractionId
            ) ?? [])
          ])
      )
    );
    return {
      attractionIds: proposal.attractionIds.filter((id) => !scheduled.has(id))
    };
  }
  const [id] = proposal.attractionIds;
  for (const [index, day] of days.entries()) {
    const position = day.entries.findIndex(
      (entry) =>
        isAttractionEntry(entry) &&
        (entry.attractionId === id ||
          entry.groupedAttractions?.some(
            (member) => member.attractionId === id
          ))
    );
    const saved = day.entries[position];
    if (saved && isAttractionEntry(saved)) {
      const endDate = saved.timing.end.slice(0, 10);
      const member = saved.groupedAttractions?.find(
        (item) => item.attractionId === id
      );
      return {
        attractionIds: proposal.attractionIds,
        entry: {
          dayNumber: index + 1,
          saved,
          member,
          endDayNumber: days.findIndex(({ date }) => date === endDate) + 1,
          transfers: member
            ? []
            : transfersForEntryRemoval(day.entries, position)
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
