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
  Text
} from "@fluentui/react-components";
import {
  ArrowClockwise20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular
} from "@fluentui/react-icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefCallback
} from "react";
import type { ChangeNotice, GetItineraryResponse } from "../../clients/manager";
import {
  attractionImportance,
  UnscheduledAttractions
} from "./UnscheduledAttractions";
import { ItineraryEntryDraft } from "./ItineraryEntryDraft";
import {
  clockOffset,
  useItineraryScheduling,
  type ItineraryScheduling
} from "./useItineraryScheduling";
import { fetchTripItinerary } from "./infra/TripApi";
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
};

type Entry = GetItineraryResponse["days"][number]["entries"][number];
type NoticeTarget = Pick<ChangeNotice, "date" | "entryId">;
const dayTargetId = (date: string): string => `itinerary-day-${date}`;
const entryTargetId = (entryId: number): string => `itinerary-entry-${entryId}`;

interface ItineraryView {
  saved?: GetItineraryResponse;
  days: GetItineraryResponse["days"];
  unscheduledAttractions: GetItineraryResponse["unscheduledAttractions"];
  loading: boolean;
  failed: boolean;
  refresh: () => Promise<GetItineraryResponse | undefined>;
  measureDayRow: RefCallback<HTMLElement>;
  start: number;
  lastStart: number;
  visibleDays: GetItineraryResponse["days"];
  showDate: (date: string) => void;
  focusNoticeTarget: (target: NoticeTarget) => void;
  scheduling: ItineraryScheduling;
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
  onDurationCorrected: (attractionId: number, duration: string) => void
): ItineraryView => {
  const [load, setLoad] = useState<LoadState>();
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (tripId === undefined) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoad((previous) => ({
      tripId,
      data: previous?.tripId === tripId ? previous.data : undefined,
      loading: true,
      failed: previous?.tripId === tripId && previous.failed
    }));
    try {
      const data = await fetchTripItinerary(tripId, controller.signal);
      if (!controller.signal.aborted) {
        setLoad({ tripId, data, loading: false, failed: false });
        return data;
      }
    } catch {
      if (!controller.signal.aborted) {
        setLoad((previous) => ({
          tripId,
          data: previous?.tripId === tripId ? previous.data : undefined,
          loading: false,
          failed: true
        }));
      }
    }
  }, [tripId]);

  useEffect(
    () => () => {
      request.current?.abort();
      request.current = null;
    },
    [refresh]
  );
  useEffect(() => {
    if (open || !request.current) void refresh();
  }, [open, refresh]);

  const current = load?.tripId === tripId ? load : undefined;
  const days = current?.data?.days ?? [];
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
  const focusNoticeTarget = ({ date, entryId }: NoticeTarget): void => {
    if (tripId === undefined) return;
    showDate(date);
    setFocusTarget({
      tripId,
      id: entryId === undefined ? dayTargetId(date) : entryTargetId(entryId)
    });
  };
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
    onDurationCorrected
  });
  return {
    saved: current?.data,
    days,
    unscheduledAttractions: current?.data?.unscheduledAttractions ?? [],
    loading: current?.loading ?? true,
    failed: current?.failed ?? false,
    refresh,
    measureDayRow,
    start,
    lastStart,
    visibleDays,
    showDate,
    focusNoticeTarget,
    scheduling
  };
};

export const ItineraryDayPager = ({
  itinerary,
  refreshBlocked
}: {
  itinerary: ItineraryView;
  refreshBlocked: boolean;
}): ReactElement | null => {
  const classes = useClasses();
  const { days, loading, refresh, start, lastStart, visibleDays, showDate } =
    itinerary;

  if (!days.length) return null;

  return (
    <nav aria-label="Itinerary day navigation" className={classes.pager}>
      <Button
        appearance="subtle"
        size="small"
        icon={<ChevronLeft20Regular />}
        aria-label="Previous day"
        title="Previous day"
        disabled={start === 0}
        onClick={() => showDate(days[start - 1].date)}
      />
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
      <Button
        appearance="subtle"
        size="small"
        icon={<ChevronRight20Regular />}
        aria-label="Next day"
        title="Next day"
        disabled={start >= lastStart}
        onClick={() => showDate(days[start + 1].date)}
      />
      <Button
        appearance="subtle"
        size="small"
        icon={<ArrowClockwise20Regular />}
        aria-label="Refresh itinerary"
        title="Refresh itinerary"
        disabledFocusable={
          refreshBlocked || loading || !!itinerary.scheduling.draft
        }
        onClick={() => void refresh()}
      />
    </nav>
  );
};

const TimelineEntry = ({ entry }: { entry: Entry }): ReactElement => {
  const classes = useClasses();
  const { Icon, tone, label } = attractionImportance(entry);
  const { start, end, zone } = entry.timing;
  // Exact equality also handles historical offsets with seconds, which Date.parse cannot read.
  const isBriefStop = start === end || Date.parse(start) === Date.parse(end);
  const startOffset = clockOffset(start);
  const endOffset = clockOffset(end);
  const showOffsets = startOffset !== endOffset;
  return (
    <li
      className={classes.entry}
      aria-label={entry.name}
      id={entryTargetId(entry.entryId)}
      tabIndex={-1}
    >
      <div className={classes.clocks}>
        <time dateTime={start} title={`${start} (${zone})`}>
          <Caption1>{start.slice(11, 16)}</Caption1>
          {showOffsets && (
            <Caption1 className={classes.clockOffset}>
              UTC{startOffset === "Z" ? "+00:00" : startOffset}
            </Caption1>
          )}
        </time>
        {!isBriefStop && (
          <time dateTime={end} title={`${end} (${zone})`}>
            <Caption1>{end.slice(11, 16)}</Caption1>
            {end.slice(0, 10) !== start.slice(0, 10) && (
              <Caption1>
                {" "}
                {new Date(end.slice(0, 10)).getUTCDate()}{" "}
                {month.format(new Date(end.slice(0, 10)))}
              </Caption1>
            )}
            {showOffsets && (
              <Caption1 className={classes.clockOffset}>
                UTC{endOffset === "Z" ? "+00:00" : endOffset}
              </Caption1>
            )}
          </time>
        )}
      </div>
      <Card size="small" appearance="outline">
        <div className={classes.iconLabel}>
          <Icon aria-hidden className={classes[tone]} />
          <Text weight="semibold">{entry.name}</Text>
          <Caption1 className={classes.visuallyHidden}>{label}</Caption1>
        </div>
        {isBriefStop && <Caption1>Brief stop</Caption1>}
      </Card>
    </li>
  );
};

export const ItineraryContent = ({
  itinerary,
  boardPlaceOrder,
  prepareBlocked,
  onPrepare
}: {
  itinerary: ItineraryView;
  boardPlaceOrder: readonly string[];
  prepareBlocked: boolean;
  onPrepare: () => void;
}): ReactElement => {
  const classes = useClasses();
  const {
    days,
    unscheduledAttractions,
    failed,
    loading,
    refresh,
    visibleDays,
    measureDayRow,
    scheduling
  } = itinerary;
  const { draft, feedback } = scheduling;
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
            onClick={() => void refresh()}
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
      {feedback && <Text role="status">{feedback}</Text>}
      {draft && !visibleDays.some((day) => day.date === draft.intent.date) && (
        <Card size="small">
          <Caption1>{formatItineraryDate(draft.intent.date)}</Caption1>
          {activeDraft}
        </Card>
      )}
      {failed && (
        <MessageBar intent="warning">
          <MessageBarBody>
            The itinerary couldn&apos;t be refreshed. Days and unscheduled
            attractions may be out of date.
          </MessageBarBody>
        </MessageBar>
      )}
      <div className={classes.itineraryColumns} aria-busy={loading}>
        <UnscheduledAttractions
          attractions={unscheduledAttractions}
          boardPlaceOrder={boardPlaceOrder}
          prepareBlocked={prepareBlocked || !!draft}
          onPrepare={onPrepare}
          days={days}
          formatDate={formatItineraryDate}
          scheduleBlocked={prepareBlocked || loading || failed || !!draft}
          onSchedule={scheduling.choose}
        />
        <section
          ref={measureDayRow}
          aria-label="Itinerary days"
          className={classes.dayRow}
          style={{
            gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`
          }}
        >
          {visibleDays.map((day) => {
            const date = new Date(day.date);
            return (
              <Card key={day.id} role="article" className={classes.day}>
                <Text
                  as="h2"
                  className={classes.dayHeading}
                  aria-label={dateLabel.format(date)}
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
                {day.entries.length > 0 && (
                  <ol className={classes.timeline} aria-label="Main path">
                    {day.entries.map((entry) => (
                      <TimelineEntry key={entry.entryId} entry={entry} />
                    ))}
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
