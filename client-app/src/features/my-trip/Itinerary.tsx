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
import type { GetItineraryResponse } from "../../clients/manager";
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

interface ItineraryView {
  days: GetItineraryResponse["days"];
  loading: boolean;
  failed: boolean;
  refresh: () => Promise<void>;
  measureDayRow: RefCallback<HTMLElement>;
  start: number;
  lastStart: number;
  visibleDays: GetItineraryResponse["days"];
  showDate: (date: string) => void;
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

export const useItinerary = (
  tripId: number | undefined,
  open: boolean
): ItineraryView => {
  const [load, setLoad] = useState<LoadState>();
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (!open || tripId === undefined) return;
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
  }, [open, tripId]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const refreshWhenVisible = (): void => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      request.current?.abort();
    };
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

  return {
    days,
    loading: current?.loading ?? true,
    failed: current?.failed ?? false,
    refresh,
    measureDayRow,
    start,
    lastStart,
    visibleDays,
    showDate
  };
};

export const ItineraryDayPager = ({
  itinerary
}: {
  itinerary: ItineraryView;
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
        disabledFocusable={loading}
        onClick={() => void refresh()}
      />
    </nav>
  );
};

export const ItineraryDays = ({
  itinerary
}: {
  itinerary: ItineraryView;
}): ReactElement => {
  const classes = useClasses();
  const { days, failed, loading, refresh, visibleDays, measureDayRow } =
    itinerary;

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
      {failed && (
        <MessageBar intent="warning">
          <MessageBarBody>
            The itinerary couldn&apos;t be refreshed. These days may be out of
            date.
          </MessageBarBody>
        </MessageBar>
      )}
      <section
        ref={measureDayRow}
        aria-label="Itinerary days"
        aria-busy={loading}
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
            </Card>
          );
        })}
      </section>
    </div>
  );
};
