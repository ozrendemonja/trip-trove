import {
  Button,
  Caption1,
  Card,
  Divider,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  Text,
  mergeClasses
} from "@fluentui/react-components";
import {
  ArrowClockwise20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular
} from "@fluentui/react-icons";
import {
  Fragment,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactElement,
  type RefCallback
} from "react";
import type {
  GetItineraryResponse,
  ItineraryTransferDto,
  ItineraryTransferRemovalResponse,
  MoveItineraryEntryRequest
} from "../../clients/manager";
import {
  attractionImportance,
  UnscheduledAttractions
} from "./UnscheduledAttractions";
import { AttractionFactsDialog } from "./AttractionFactsDialog";
import { ItineraryEntryDraft } from "./ItineraryEntryDraft";
import { DayNoteEditor, ItineraryDayNote } from "./ItineraryDayNote";
import { ItineraryWarning, warningCountLabel } from "./ItineraryWarning";
import {
  EntryGrouping,
  JoinAttractionDialog,
  useItineraryGrouping
} from "./ItineraryGrouping";
import {
  TransferEditor,
  TransferLine,
  TransfersToRemoveDialog
} from "./ItineraryTransfer";
import {
  ItineraryEntryActions,
  MoveStartChoice
} from "./ItineraryEntryActions";
import {
  attractionNameId,
  dropSlot,
  gapSuggestion,
  type DraggedItineraryItem,
  type ItineraryAttraction,
  type OpenAttractionFacts
} from "./ItineraryDrag";
import {
  useItineraryScheduling,
  type ItineraryScheduling
} from "./useItineraryScheduling";
import { useItineraryDayNotes } from "./useItineraryDayNotes";
import {
  editKind,
  useItineraryTimingEdit,
  type ItineraryTimingEditing
} from "./useItineraryTimingEdit";
import { entryTargetId, TimelineEntry } from "./TimelineEntry";
import { elapsedMinutes, freeTimeLabel } from "./itineraryClocks";
import { fetchTripItinerary } from "./infra/TripApi";
import {
  usePlanningDraft,
  usePlanningReads,
  type PlanningWorkspace
} from "./useTripPlanningWorkspace";
import {
  DAY_COLUMN_GAP,
  DAY_COLUMN_MIN_WIDTH,
  useClasses
} from "./Itinerary.styles";

type LoadState = {
  tripId: number;
  data?: GetItineraryResponse;
  loading: boolean;
  failed: boolean;
  newer?: boolean;
};

export interface ItineraryTarget {
  date: string;
  entryId?: number;
}

type ScheduledEntryTarget = ItineraryTarget & {
  entryId: number;
  dayNumber: number;
};

type Day = GetItineraryResponse["days"][number];
type Entry = Day["entries"][number];
type TransferRemovalChoice = {
  entry: Entry;
  day: Day;
  transfers: ItineraryTransferRemovalResponse[];
} & (
  { action: "move"; position: MoveItineraryEntryRequest } | { action: "remove" }
);

const dayTargetId = (date: string): string => `itinerary-day-${date}`;

function locateAttraction(
  itinerary: GetItineraryResponse | undefined,
  attractionId: number
): { attraction: ItineraryAttraction; date?: string } | undefined {
  if (!itinerary) return;
  for (const day of itinerary.days) {
    for (const entry of day.entries) {
      if (entry.attractionId === attractionId)
        return { attraction: entry, date: day.date };
      const member = entry.groupedAttractions?.find(
        (item) => item.attractionId === attractionId
      );
      if (member) return { attraction: member, date: day.date };
    }
  }
  const attraction = itinerary.unscheduledAttractions.find(
    (item) => item.attractionId === attractionId
  );
  if (attraction) return { attraction };
}

interface ItineraryView {
  saved?: GetItineraryResponse;
  days: GetItineraryResponse["days"];
  unscheduledAttractions: GetItineraryResponse["unscheduledAttractions"];
  loading: boolean;
  failed: boolean;
  newer: boolean;
  scheduledEntries: ReadonlyMap<number, ScheduledEntryTarget>;
  refresh: () => Promise<GetItineraryResponse | undefined>;
  checkForUpdates: () => Promise<GetItineraryResponse | undefined>;
  measureDayRow: RefCallback<HTMLElement>;
  start: number;
  lastStart: number;
  visibleDays: GetItineraryResponse["days"];
  showDate: (date: string) => void;
  focusItineraryTarget: (target: ItineraryTarget) => void;
  dragged?: DraggedItineraryItem;
  setDragged: (item?: DraggedItineraryItem) => void;
  scheduling: ItineraryScheduling;
  timingEditing: ItineraryTimingEditing;
  dayNotes: ReturnType<typeof useItineraryDayNotes>;
  onDurationCorrected: (attractionId: number, duration: string) => void;
}

const dateLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});
const weekday = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC"
});
const month = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC"
});
export const formatItineraryDate = (date: string): string =>
  dateLabel.format(new Date(date));

export const useItinerary = (
  tripId: number | undefined,
  open: boolean,
  workspace: PlanningWorkspace,
  onDurationCorrected: (attractionId: number, duration: string) => void,
  returnAttractionId?: number
): ItineraryView => {
  const [load, setLoad] = useState<LoadState>();
  const accepted = useRef<GetItineraryResponse>(undefined);
  const reconciling =
    useRef<Promise<GetItineraryResponse | undefined>>(undefined);
  const { start: startRead, hasRequested } = usePlanningReads(
    tripId,
    workspace
  );
  const read = useCallback(
    async (protectDrafts: boolean) => {
      if (
        tripId === undefined ||
        (protectDrafts && (workspace.isWriting() || reconciling.current))
      )
        return;
      const request = startRead();
      const previousData =
        accepted.current?.tripId === tripId ? accepted.current : undefined;
      setLoad((previous) => ({
        tripId,
        data: previousData,
        loading: true,
        failed: previous?.tripId === tripId && previous.failed,
        newer: previous?.tripId === tripId && previous.newer
      }));
      try {
        const data = await fetchTripItinerary(tripId, request.signal);
        if (!request.isCurrent()) return;
        const unchanged =
          previousData && JSON.stringify(previousData) === JSON.stringify(data);
        if (previousData && protectDrafts && workspace.hasLocalWork()) {
          setLoad({
            tripId,
            data: previousData,
            loading: false,
            failed: false,
            newer: !unchanged
          });
          return;
        }
        const next = unchanged ? previousData : data;
        accepted.current = next;
        setLoad({ tripId, data: next, loading: false, failed: false });
        return next;
      } catch {
        if (request.isCurrent()) {
          setLoad((previous) => ({
            tripId,
            data: previousData,
            loading: false,
            failed: true,
            newer: previous?.newer
          }));
        }
      } finally {
        if (request.isLatest() && !request.isCurrent()) {
          setLoad((previous) =>
            previous?.tripId === tripId
              ? {
                  ...previous,
                  loading: false,
                  failed: !previous.data || previous.failed
                }
              : previous
          );
        }
      }
    },
    [startRead, tripId, workspace]
  );

  const refresh = useCallback(() => {
    const result = read(false);
    reconciling.current = result;
    return result.finally(() => {
      if (reconciling.current === result) reconciling.current = undefined;
    });
  }, [read]);
  const checkForUpdates = useCallback(() => read(true), [read]);

  const current = load?.tripId === tripId ? load : undefined;
  const savedDays = current?.data?.days;
  const days = savedDays ?? [];
  const scheduledEntries = useMemo(() => {
    const byAttraction = new Map<number, ScheduledEntryTarget>();
    savedDays?.forEach(({ date, entries }, index) => {
      for (const { attractionId, entryId, groupedAttractions } of entries) {
        const target = { date, entryId, dayNumber: index + 1 };
        byAttraction.set(attractionId, target);
        groupedAttractions?.forEach((member) =>
          byAttraction.set(member.attractionId, target)
        );
      }
    });
    return byAttraction;
  }, [savedDays]);
  const [anchor, setAnchor] = useState<{ tripId: number; date: string }>();
  const [columns, setColumns] = useState(1);
  const measureDayRow = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setColumns(
        Math.max(
          1,
          Math.floor(
            (entry.contentRect.width + DAY_COLUMN_GAP) /
              (DAY_COLUMN_MIN_WIDTH + DAY_COLUMN_GAP)
          )
        )
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const lastStart = Math.max(0, days.length - columns);
  const anchorIndex =
    anchor && anchor.tripId === tripId
      ? days.findIndex((day) => day.date >= anchor.date)
      : 0;
  const start =
    anchorIndex === -1 ? lastStart : Math.min(anchorIndex, lastStart);
  const visibleDays = days.slice(start, start + columns);
  const showDate = (date: string): void => {
    if (tripId !== undefined) setAnchor({ tripId, date });
  };
  const [focusTarget, setFocusTarget] = useState<{
    tripId: number;
    id: string;
  }>();
  const focusItineraryTarget = ({ date, entryId }: ItineraryTarget): void => {
    if (tripId === undefined) return;
    if (!open || !visibleDays.some((day) => day.date === date)) showDate(date);
    setFocusTarget({
      tripId,
      id: entryId === undefined ? dayTargetId(date) : entryTargetId(entryId)
    });
  };
  const focusReturnedAttraction = useEffectEvent(
    (attractionId: number, saved: GetItineraryResponse | undefined): void => {
      if (tripId === undefined) return;
      const target = locateAttraction(saved, attractionId);
      if (target) {
        const { date } = target;
        if (date && !visibleDays.some((day) => day.date === date)) {
          showDate(date);
        }
        setFocusTarget({ tripId, id: attractionNameId(attractionId) });
      } else if (visibleDays[0]) {
        setFocusTarget({ tripId, id: dayTargetId(visibleDays[0].date) });
      }
    }
  );
  useEffect(() => {
    if (!open && hasRequested()) return;
    if (!open || returnAttractionId === undefined) {
      void checkForUpdates();
      return;
    }
    const read = reconciling.current ?? checkForUpdates();
    let returning = true;
    void read.then((saved) => {
      if (returning) focusReturnedAttraction(returnAttractionId, saved);
    });
    return () => {
      returning = false;
    };
  }, [open, returnAttractionId, hasRequested, checkForUpdates]);
  useEffect(() => {
    if (!open || !focusTarget || focusTarget.tripId !== tripId) return;
    // Let the dialog restore focus before moving it to the revealed target.
    const frame = requestAnimationFrame(() => {
      document.getElementById(focusTarget.id)?.focus();
      setFocusTarget(undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, focusTarget, tripId]);

  const scheduling = useItineraryScheduling({
    tripId,
    timeZone: current?.data?.timeZone,
    loadSaved: refresh,
    showDate,
    onDurationCorrected,
    workspace
  });
  const timingEditing = useItineraryTimingEdit(tripId, refresh, workspace);
  const dayNotes = useItineraryDayNotes(tripId, refresh, workspace);
  const [dragged, setDragged] = useState<DraggedItineraryItem>();
  return {
    saved: current?.data,
    days,
    unscheduledAttractions: current?.data?.unscheduledAttractions ?? [],
    loading: current?.loading ?? true,
    failed: current?.failed ?? false,
    newer: current?.newer ?? false,
    scheduledEntries,
    refresh,
    checkForUpdates,
    measureDayRow,
    start,
    lastStart,
    visibleDays,
    showDate,
    focusItineraryTarget,
    dragged,
    setDragged,
    scheduling,
    timingEditing,
    dayNotes,
    onDurationCorrected
  };
};

export const ItineraryRefreshNotice = ({
  failed,
  newer,
  staleMessage
}: {
  failed: boolean;
  newer: boolean;
  staleMessage: string;
}): ReactElement | null => {
  if (!failed && !newer) return null;
  return (
    <MessageBar intent={failed ? "warning" : "info"}>
      <MessageBarBody>
        {failed
          ? `The itinerary couldn't be refreshed. ${staleMessage}`
          : "Newer itinerary data is available. Finish or resolve your change, then refresh to see it."}
      </MessageBarBody>
    </MessageBar>
  );
};

export const ItineraryDayPager = ({
  itinerary,
  refreshBlocked
}: {
  itinerary: ItineraryView;
  refreshBlocked: boolean;
}): ReactElement | null => {
  const classes = useClasses();
  const {
    days,
    checkForUpdates,
    start,
    lastStart,
    visibleDays,
    showDate,
    dragged
  } = itinerary;
  const hoverTimer = useRef<number | undefined>(undefined);
  const stopHover = useCallback(() => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = undefined;
  }, []);
  useEffect(() => {
    window.addEventListener("dragend", stopHover);
    return () => {
      window.removeEventListener("dragend", stopHover);
      stopHover();
    };
  }, [stopHover]);
  const pageDuringDrag = (event: DragEvent, date?: string): void => {
    if (!date || !dragged) return;
    event.preventDefault();
    hoverTimer.current ??= window.setTimeout(() => showDate(date), 350);
  };

  if (!days.length) return null;

  return (
    <nav aria-label="Itinerary day navigation" className={classes.pager}>
      <span
        onDragOver={(event) => pageDuringDrag(event, days[start - 1]?.date)}
        onDragLeave={stopHover}
        onDrop={stopHover}
      >
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronLeft20Regular />}
          aria-label="Previous day"
          title="Previous day"
          disabled={start === 0}
          onClick={() => showDate(days[start - 1].date)}
        />
      </span>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button appearance="subtle" size="small">
            {visibleDays.length === 1
              ? `Day ${start + 1} of ${days.length}`
              : `Days ${start + 1}\u2013${start + visibleDays.length} of ${days.length}`}
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList className={classes.dateList}>
            {days.map((day) => (
              <MenuItem key={day.id} onClick={() => showDate(day.date)}>
                {dateLabel.format(new Date(day.date))}
              </MenuItem>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
      <span
        onDragOver={(event) =>
          pageDuringDrag(
            event,
            start < lastStart ? days[start + 1]?.date : undefined
          )
        }
        onDragLeave={stopHover}
        onDrop={stopHover}
      >
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronRight20Regular />}
          aria-label="Next day"
          title="Next day"
          disabled={start >= lastStart}
          onClick={() => showDate(days[start + 1].date)}
        />
      </span>
      <Button
        appearance="subtle"
        size="small"
        icon={<ArrowClockwise20Regular />}
        aria-label="Refresh itinerary"
        title="Refresh itinerary"
        disabledFocusable={refreshBlocked}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => void checkForUpdates()}
      />
    </nav>
  );
};

export const ItineraryContent = ({
  itinerary,
  boardPlaceOrder,
  prepareBlocked,
  onPrepare,
  onEditTripData
}: {
  itinerary: ItineraryView;
  boardPlaceOrder: readonly string[];
  prepareBlocked: boolean;
  onPrepare: () => void;
  onEditTripData: (attractionId: number) => void;
}): ReactElement => {
  const classes = useClasses();
  const {
    days,
    unscheduledAttractions,
    failed,
    newer,
    loading,
    checkForUpdates,
    visibleDays,
    measureDayRow,
    scheduling,
    timingEditing,
    dayNotes,
    focusItineraryTarget,
    dragged,
    setDragged
  } = itinerary;
  const { draft, feedback } = scheduling;
  const { pending, rejections } = timingEditing;
  const writeBlocked =
    prepareBlocked ||
    (loading && !days.length) ||
    failed ||
    !!draft ||
    !!dayNotes.draft ||
    !!pending;
  const [hovered, setHovered] = useState<{ date: string; slot: number }>();
  const [actionStatus, setActionStatus] = useState("");
  const grouping = useItineraryGrouping(
    timingEditing,
    itinerary.onDurationCorrected,
    setActionStatus
  );
  const [factsTarget, setFactsTarget] = useState<{
    attractionId: number;
    trigger: HTMLButtonElement;
  }>();
  const factsAttraction =
    factsTarget &&
    locateAttraction(itinerary.saved, factsTarget.attractionId)?.attraction;
  const openFacts: OpenAttractionFacts = (attractionId, trigger) => {
    trigger.focus({ preventScroll: true });
    setFactsTarget({ attractionId, trigger });
  };
  const closeFacts = (): void => {
    setFactsTarget(undefined);
    requestAnimationFrame(() => {
      if (factsTarget?.trigger.isConnected) factsTarget.trigger.focus();
    });
  };
  const [moveChoice, setMoveChoice] = useState<{
    entry: Entry;
    sourceDate: string;
    position: MoveItineraryEntryRequest;
    offsets: string[];
  }>();
  const [transferRemoval, setTransferRemoval] =
    useState<TransferRemovalChoice>();
  const [transferEdit, setTransferEdit] = useState<{
    from: Entry;
    to: Entry;
    trigger: HTMLButtonElement;
  }>();
  const cancelMoveChoice = (): void => {
    if (!moveChoice) return;
    focusItineraryTarget({
      date: moveChoice.sourceDate,
      entryId: moveChoice.entry.entryId
    });
    setMoveChoice(undefined);
    timingEditing.discardRejection(moveChoice.entry.entryId, "move");
  };
  usePlanningDraft(!!moveChoice, cancelMoveChoice);
  const cancelTransferRemoval = (): void => {
    if (!transferRemoval) return;
    const { entry, day, action } = transferRemoval;
    timingEditing.discardRejection(entry.entryId, action);
    focusItineraryTarget({ date: day.date, entryId: entry.entryId });
    setTransferRemoval(undefined);
  };
  usePlanningDraft(!!transferRemoval, cancelTransferRemoval);
  const closeTransferEdit = (): void => {
    if (
      !transferEdit ||
      pending?.activity ||
      pending?.recovery === "unconfirmed"
    )
      return;
    const { from, trigger } = transferEdit;
    timingEditing.discardRejection(from.entryId, "transfer");
    setTransferEdit(undefined);
    requestAnimationFrame(() => {
      if (trigger.isConnected) trigger.focus();
    });
  };
  usePlanningDraft(!!transferEdit, closeTransferEdit);
  const interactionBlocked =
    writeBlocked ||
    !!moveChoice ||
    !!transferRemoval ||
    !!transferEdit ||
    !!grouping.choice;

  const move = (entry: Entry, position: MoveItineraryEntryRequest): void => {
    if (writeBlocked || (moveChoice && position.startOffset === undefined))
      return;
    const { entryId, name } = entry;
    const source = days.find((day) =>
      day.entries.some((item) => item.entryId === entryId)
    );
    if (!source) return;
    const index = source.entries.findIndex((item) => item.entryId === entryId);
    const next = source.entries[index + 1];
    if (
      source.date === position.date &&
      next?.entryId === position.beforeEntryId
    ) {
      focusItineraryTarget({ date: source.date, entryId });
      setActionStatus(`${name} is already in that position.`);
      return;
    }

    setActionStatus("");
    void timingEditing
      .save(entryId, { action: "move", position }, (saved, outcome) => {
        const destination = saved.days.find((day) =>
          day.entries.some((item) => item.entryId === entryId)
        );
        if (!destination) {
          focusItineraryTarget({ date: source.date });
          setActionStatus(
            `Saved itinerary reloaded. ${name} is no longer in the itinerary.`
          );
          return;
        }
        focusItineraryTarget({ date: destination.date, entryId });
        setActionStatus(
          outcome === "unconfirmed"
            ? `Saved itinerary reloaded. ${name} is on ${formatItineraryDate(destination.date)}.`
            : `${name} moved to ${formatItineraryDate(destination.date)}.`
        );
      })
      .then((error) => {
        if (!error) return;
        if (error.moveOffsets?.length === 2) {
          setMoveChoice({
            entry,
            position,
            sourceDate: source.date,
            offsets: error.moveOffsets
          });
          return;
        }
        if (error.transfersToRemove) {
          setTransferRemoval({
            action: "move",
            entry,
            day: source,
            position,
            transfers: error.transfersToRemove
          });
          return;
        }
        focusItineraryTarget({ date: source.date, entryId });
      });
  };
  const remove = (
    entry: Entry,
    day: Day,
    transfersToRemove?: ItineraryTransferDto[]
  ): void => {
    if (writeBlocked) return;
    setActionStatus("");
    void timingEditing
      .save(
        entry.entryId,
        {
          action: "remove",
          removal: transfersToRemove && {
            transfersToRemove
          }
        },
        (saved) => {
          const present = saved.days.find((candidate) =>
            candidate.entries.some((item) => item.entryId === entry.entryId)
          );
          if (present) {
            focusItineraryTarget({
              date: present.date,
              entryId: entry.entryId
            });
            setActionStatus(
              `Saved itinerary reloaded. ${entry.name} is still in the itinerary.`
            );
            return;
          }
          focusItineraryTarget({ date: day.date });
          setActionStatus(`${entry.name} removed from the itinerary.`);
        }
      )
      .then((error) => {
        if (!error) return;
        if (error.transfersToRemove) {
          setTransferRemoval({
            action: "remove",
            entry,
            day,
            transfers: error.transfersToRemove
          });
          return;
        }
        focusItineraryTarget({ date: day.date, entryId: entry.entryId });
      });
  };
  const endDrag = useCallback((): void => {
    setDragged(undefined);
    setHovered(undefined);
  }, [setDragged]);
  useEffect(() => {
    window.addEventListener("dragend", endDrag);
    return () => window.removeEventListener("dragend", endDrag);
  }, [endDrag]);
  const dragSourceDate =
    dragged?.kind === "entry"
      ? dragged.entry.timing.start.slice(0, 10)
      : undefined;
  // Keep the source mounted when hovering the pager reveals a different day.
  const renderedDays = days.filter(
    (day) => day.date === dragSourceDate || visibleDays.includes(day)
  );
  const dragOver = (event: DragEvent<HTMLElement>, day: Day): void => {
    if (interactionBlocked || !dragged) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = dragged.kind === "pool" ? "copy" : "move";
    const slot = dropSlot(event, day);
    if (hovered?.date !== day.date || hovered.slot !== slot) {
      setHovered({ date: day.date, slot });
    }
  };
  const drop = (event: DragEvent<HTMLElement>, day: Day): void => {
    if (interactionBlocked || !dragged) return;
    event.preventDefault();
    const slot = dropSlot(event, day);
    if (dragged.kind === "pool") {
      const button = event.currentTarget.ownerDocument.getElementById(
        `itinerary-add-${dragged.attraction.attractionId}`
      );
      scheduling.choose(
        dragged.attraction,
        day,
        button instanceof HTMLButtonElement ? button : null,
        gapSuggestion(days, day, slot)
      );
    } else {
      const before = day.entries
        .slice(slot)
        .find((entry) => entry.entryId !== dragged.entry.entryId);
      move(dragged.entry, { date: day.date, beforeEntryId: before?.entryId });
    }
    endDrag();
  };
  const activeDraft = draft && (
    <ItineraryEntryDraft
      draft={draft}
      scheduling={scheduling}
      blocked={prepareBlocked}
    />
  );

  if (!days.length) {
    return failed ? (
      <MessageBar intent="error">
        <MessageBarBody>The itinerary couldn&apos;t be loaded.</MessageBarBody>
        <MessageBarActions>
          <Button
            size="small"
            disabledFocusable={loading}
            onClick={() => void checkForUpdates()}
          >
            Retry
          </Button>
        </MessageBarActions>
      </MessageBar>
    ) : (
      <Spinner label="Loading itinerary" />
    );
  }

  return (
    <div className={classes.itinerary}>
      <DayNoteEditor editing={dayNotes} />
      <JoinAttractionDialog grouping={grouping} />
      {factsAttraction && (
        <AttractionFactsDialog
          key={factsAttraction.attractionId}
          attraction={factsAttraction}
          importance={attractionImportance(factsAttraction).label}
          onClose={closeFacts}
          onEditTripData={() => {
            setFactsTarget(undefined);
            onEditTripData(factsAttraction.attractionId);
          }}
        />
      )}
      {moveChoice && (
        <MoveStartChoice
          entry={moveChoice.entry}
          offsets={moveChoice.offsets}
          onCancel={cancelMoveChoice}
          onChoose={(startOffset) => {
            setMoveChoice(undefined);
            move(moveChoice.entry, { ...moveChoice.position, startOffset });
          }}
        />
      )}
      {transferEdit && (
        <TransferEditor
          from={transferEdit.from}
          to={transferEdit.to}
          editing={timingEditing}
          onClose={closeTransferEdit}
          onSaved={setActionStatus}
        />
      )}
      {draft?.transfersToRemove && (
        <TransfersToRemoveDialog
          transfers={draft.transfersToRemove}
          scheduling
          blocked={prepareBlocked || !!draft.activity}
          onCancel={scheduling.cancel}
          onConfirm={() => void scheduling.submitWithTransfersToRemove()}
        />
      )}
      {transferRemoval && (
        <TransfersToRemoveDialog
          transfers={transferRemoval.transfers}
          blocked={writeBlocked}
          onCancel={cancelTransferRemoval}
          onConfirm={() => {
            const { entry, day, transfers } = transferRemoval;
            const transfersToRemove = transfers.map(({ transfer }) => transfer);
            setTransferRemoval(undefined);
            if (transferRemoval.action === "move") {
              move(entry, {
                ...transferRemoval.position,
                transfersToRemove
              });
            } else {
              remove(entry, day, transfersToRemove);
            }
          }}
        />
      )}
      {feedback && <Text role="status">{feedback}</Text>}
      <Text
        role="status"
        className={actionStatus ? undefined : classes.visuallyHidden}
      >
        {actionStatus}
      </Text>
      {rejections.map(({ entryId, edit, message, inspected }) => {
        const kind = editKind(edit);
        if (
          (kind === "move" && moveChoice?.entry.entryId === entryId) ||
          (kind === transferRemoval?.action &&
            transferRemoval.entry.entryId === entryId) ||
          (kind === "transfer" && transferEdit?.from.entryId === entryId) ||
          (kind === "join" && grouping.choice?.host.entryId === entryId)
        )
          return null;
        const composition =
          kind === "move" || kind === "remove" || kind === "join";
        const visible = visibleDays.some((day) =>
          day.entries.some((entry) => entry.entryId === entryId)
        );
        return (
          <MessageBar intent="error" key={`${entryId}:${kind}`}>
            <MessageBarBody>
              {composition || inspected || !visible
                ? message
                : "An entry change is still unsaved."}
            </MessageBarBody>
            <MessageBarActions>
              <Button
                size="small"
                onClick={() => timingEditing.discardRejection(entryId, kind)}
              >
                {composition ? "Dismiss" : "Discard entry change"}
              </Button>
            </MessageBarActions>
          </MessageBar>
        );
      })}
      {pending?.recovery && !transferEdit && !grouping.pending && (
        <MessageBar intent="warning">
          <MessageBarBody>
            {pending.recovery === "unconfirmed"
              ? "The entry save couldn't be confirmed. Inspect the saved itinerary before editing again."
              : "The entry change was saved, but the itinerary couldn't be refreshed."}
          </MessageBarBody>
          <MessageBarActions>
            <Button
              size="small"
              disabledFocusable={!!pending.activity}
              onClick={() => void timingEditing.inspect()}
            >
              Inspect saved itinerary
            </Button>
          </MessageBarActions>
        </MessageBar>
      )}
      {draft && !visibleDays.some((day) => day.date === draft.intent.date) && (
        <Card size="small">
          <Caption1>{formatItineraryDate(draft.intent.date)}</Caption1>
          {activeDraft}
        </Card>
      )}
      <ItineraryRefreshNotice
        failed={failed && !pending?.recovery}
        newer={newer && !failed}
        staleMessage="Days and unscheduled attractions may be out of date."
      />
      <div className={classes.itineraryColumns} aria-busy={loading}>
        <UnscheduledAttractions
          attractions={unscheduledAttractions}
          boardPlaceOrder={boardPlaceOrder}
          prepareBlocked={
            prepareBlocked ||
            !!draft ||
            !!pending ||
            !!dayNotes.draft ||
            !!moveChoice ||
            !!transferRemoval ||
            !!transferEdit ||
            !!grouping.choice
          }
          onPrepare={onPrepare}
          days={days}
          formatDate={formatItineraryDate}
          scheduleBlocked={interactionBlocked}
          onSchedule={scheduling.choose}
          onGrab={setDragged}
          onRelease={endDrag}
          onOpenFacts={openFacts}
        />
        <section
          ref={measureDayRow}
          aria-label="Itinerary days"
          className={classes.dayRow}
          style={{
            gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`
          }}
        >
          {renderedDays.map((day) => {
            const date = new Date(day.date);
            const label = dateLabel.format(date);
            const warnings = day.entries.reduce(
              (count, entry) =>
                count +
                entry.warnings.length +
                (entry.groupedAttractions?.reduce(
                  (sum, member) => sum + member.warnings.length,
                  0
                ) ?? 0),
              0
            );
            const hidden = !visibleDays.includes(day);
            const activeSlot =
              hovered?.date === day.date ? hovered.slot : undefined;
            const slotClass = (slot: number, gap = false): string =>
              mergeClasses(
                classes.dropSlot,
                gap && classes.freeTime,
                slot === activeSlot && classes.activeDropSlot
              );
            return (
              <Card
                key={day.id}
                role="article"
                aria-label={label}
                inert={hidden}
                className={mergeClasses(
                  classes.day,
                  hidden && classes.hiddenDragSource,
                  activeSlot !== undefined &&
                    day.entries.length === 0 &&
                    classes.dropOnEmptyDay
                )}
                onDragOver={(event) => dragOver(event, day)}
                onDragLeave={(event) => {
                  if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                  ) {
                    setHovered((target) =>
                      target?.date === day.date ? undefined : target
                    );
                  }
                }}
                onDrop={(event) => drop(event, day)}
              >
                <Text
                  as="h2"
                  className={classes.dayHeading}
                  aria-label={label}
                  id={dayTargetId(day.date)}
                  tabIndex={-1}
                >
                  <time dateTime={day.date} className={classes.dayLabel}>
                    <Caption1>{weekday.format(date)}</Caption1>
                    <Text weight="semibold" className={classes.dateNumber}>
                      {date.getUTCDate()}
                    </Text>
                    <Caption1>{month.format(date)}</Caption1>
                  </time>
                </Text>
                <Divider />
                {warnings > 0 && (
                  <ItineraryWarning>
                    {warningCountLabel(warnings)}
                  </ItineraryWarning>
                )}
                <ItineraryDayNote
                  subject={label}
                  value={day.note}
                  blocked={interactionBlocked}
                  saved={dayNotes.savedDate === day.date}
                  onEdit={(button) =>
                    dayNotes.open(day.date, label, day.note, button)
                  }
                />
                {day.entries.length > 0 && (
                  <ol className={classes.timeline} aria-label="Main path">
                    {day.entries.map((entry, index) => {
                      const previous = day.entries[index - 1];
                      const gap = previous
                        ? elapsedMinutes(
                            previous.timing.end,
                            entry.timing.start
                          ) - (previous.outgoingTransfer?.minutes ?? 0)
                        : 0;
                      return (
                        <Fragment key={entry.entryId}>
                          <li
                            data-itinerary-slot={index}
                            aria-hidden={!previous || undefined}
                            className={slotClass(index, gap > 0)}
                          >
                            {previous && (
                              <TransferLine
                                from={previous}
                                to={entry}
                                blocked={interactionBlocked}
                                onEdit={(trigger) =>
                                  setTransferEdit({
                                    from: previous,
                                    to: entry,
                                    trigger
                                  })
                                }
                              />
                            )}
                            {gap > 0 && (
                              <Caption1>{freeTimeLabel(gap)}</Caption1>
                            )}
                          </li>
                          <TimelineEntry
                            entry={entry}
                            index={index}
                            editing={timingEditing}
                            blocked={interactionBlocked}
                            onGrab={setDragged}
                            onRelease={endDrag}
                            onOpenFacts={openFacts}
                            grouping={
                              itinerary.saved && (
                                <EntryGrouping
                                  entry={entry}
                                  itinerary={itinerary.saved}
                                  blocked={interactionBlocked}
                                  onChoose={grouping.choose}
                                  onOpenFacts={openFacts}
                                />
                              )
                            }
                            actions={
                              <ItineraryEntryActions
                                entry={entry}
                                day={day}
                                index={index}
                                days={days}
                                blocked={interactionBlocked}
                                formatDate={formatItineraryDate}
                                onMove={(position) => move(entry, position)}
                                onRemove={() => remove(entry, day)}
                              />
                            }
                          />
                        </Fragment>
                      );
                    })}
                    <li
                      data-itinerary-slot={day.entries.length}
                      aria-hidden="true"
                      className={slotClass(day.entries.length)}
                    />
                  </ol>
                )}
                {draft?.intent.date === day.date && activeDraft}
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
};
