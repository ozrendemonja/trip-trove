import {
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tab,
  TabList,
  Text,
  makeStyles,
  shorthands,
  tokens,
  useId
} from "@fluentui/react-components";
import { Alert16Regular, ArrowClockwise16Regular } from "@fluentui/react-icons";
import { useState, type ReactElement } from "react";
import type { ChangeNotice, GetItineraryResponse } from "../../clients/manager";
import { formatItineraryDate } from "./Itinerary";
import type { useItineraryCheck } from "./useItineraryCheck";
import { usePlanningDraft } from "./useTripPlanningWorkspace";

const stateLabels: Record<GetItineraryResponse["checkState"], string> = {
  NOT_YET_CHECKED: "Not yet checked",
  MANUALLY_CHECKED: "Manually checked",
  CHANGED_SINCE_LAST_CHECK: "Changed since last check"
};
const reasonLabels: Record<ChangeNotice["reasons"][number], string> = {
  ATTRACTION_ADDED: "Added to the itinerary",
  START_CHANGED: "Start clock changed",
  PLANNED_LENGTH_CHANGED: "Planned length changed",
  FIXED_START_CHANGED: "Start lock changed",
  ENTRY_MOVED: "Moved in the itinerary",
  ENTRY_REMOVED: "Removed from the itinerary",
  FOLLOWING_STARTS_PUSHED: "Following entries moved later",
  ATTRACTION_EXCLUDED: "Moved to Excluded Attractions on the board",
  REMOVED_FROM_TRIP: "Removed from the trip"
};

const useStyles = makeStyles({
  group: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    paddingBlock: tokens.spacingVerticalXS,
    minWidth: 0
  },
  changes: {
    color: tokens.colorPaletteRedForeground1,
    backgroundColor: tokens.colorPaletteRedBackground1,
    ...shorthands.borderColor(tokens.colorPaletteRedBorder1),
    ":hover": { color: tokens.colorPaletteRedForeground1 },
    ":active": { color: tokens.colorPaletteRedForeground1 }
  },
  qualification: { color: tokens.colorPaletteRedForeground1 },
  details: { maxWidth: "min(300px, 85vw)" },
  hidden: {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap"
  },
  notices: {
    listStyleType: "none",
    padding: 0,
    display: "grid",
    gap: tokens.spacingVerticalM
  },
  notice: {
    display: "grid",
    justifyItems: "start",
    gap: tokens.spacingVerticalXXS,
    overflowWrap: "anywhere"
  },
  reasons: { margin: 0, paddingInlineStart: tokens.spacingHorizontalL }
});

interface Props {
  saved?: GetItineraryResponse;
  failed: boolean;
  loading: boolean;
  showAction: boolean;
  unavailableReason?: string;
  jumpBlocked: boolean;
  check: ReturnType<typeof useItineraryCheck>;
  onJump: (notice: ChangeNotice) => void;
  onRetry: () => void;
}

export function ItineraryCheckControls({
  saved,
  failed,
  loading,
  showAction,
  unavailableReason,
  jumpBlocked,
  check,
  onJump,
  onRetry
}: Props): ReactElement {
  const classes = useStyles();
  const detailsId = useId("check-availability");
  const tabId = useId("check-changes");
  const panelId = useId("check-change-notices");
  const [confirmation, setConfirmation] = useState<GetItineraryResponse>();
  usePlanningDraft(!!confirmation, () => setConfirmation(undefined));
  const notices = saved?.changeNotices ?? [];
  const empty = confirmation?.days.every((day) => day.entries.length === 0);
  const confirmationProblem =
    unavailableReason ??
    (confirmation !== saved
      ? "The saved itinerary was refreshed. Close this dialog and confirm again."
      : undefined);

  const hasTarget = (notice: ChangeNotice): boolean => {
    const day = saved?.days.find((candidate) => candidate.date === notice.date);
    return (
      day !== undefined &&
      (notice.entryId === undefined ||
        day.entries.some((entry) => entry.entryId === notice.entryId))
    );
  };

  return (
    <div className={classes.group}>
      <Caption1 role="status">
        {saved
          ? stateLabels[saved.checkState]
          : failed
            ? "Check state unavailable"
            : "Loading check state..."}
      </Caption1>
      {failed && saved && (
        <Caption1 className={classes.qualification}>Refresh needed</Caption1>
      )}
      {!showAction && failed && (
        <Button
          size="small"
          appearance="subtle"
          icon={<ArrowClockwise16Regular />}
          disabledFocusable={loading}
          aria-label="Retry loading check state"
          title="Retry loading check state"
          onClick={onRetry}
        />
      )}
      {notices.length > 0 && (
        <Dialog>
          <DialogTrigger disableButtonEnhancement>
            <Button
              size="small"
              appearance="outline"
              icon={<Alert16Regular />}
              className={classes.changes}
            >
              {notices.length} {notices.length === 1 ? "change" : "changes"} to
              check
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Itinerary changes</DialogTitle>
              <DialogContent>
                <TabList selectedValue="changes" aria-label="Check information">
                  <Tab value="changes" id={tabId} aria-controls={panelId}>
                    Changes to check
                  </Tab>
                </TabList>
                <div role="tabpanel" id={panelId} aria-labelledby={tabId}>
                  <ul className={classes.notices}>
                    {notices.map((notice, index) => (
                      <li
                        key={
                          notice.entryId ??
                          `${notice.date}:${notice.subject}:${index}`
                        }
                        className={classes.notice}
                      >
                        <Text weight="semibold">{notice.subject}</Text>
                        <Caption1>{formatItineraryDate(notice.date)}</Caption1>
                        <ul className={classes.reasons}>
                          {notice.reasons.map((reason) => (
                            <li key={reason}>{reasonLabels[reason]}</li>
                          ))}
                        </ul>
                        {hasTarget(notice) && (
                          <DialogTrigger
                            action="close"
                            disableButtonEnhancement
                          >
                            <Button
                              size="small"
                              disabledFocusable={jumpBlocked}
                              onClick={() => onJump(notice)}
                            >
                              {notice.entryId === undefined
                                ? "Go to day"
                                : "Go to entry"}
                            </Button>
                          </DialogTrigger>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger action="close" disableButtonEnhancement>
                  <Button>Close</Button>
                </DialogTrigger>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
      {showAction && (
        <>
          <Dialog
            open={!!confirmation}
            onOpenChange={(_event, info) =>
              setConfirmation(info.open ? saved : undefined)
            }
          >
            <DialogTrigger disableButtonEnhancement>
              <Button
                size="small"
                appearance="subtle"
                disabledFocusable={!!unavailableReason}
                aria-describedby={unavailableReason ? detailsId : undefined}
              >
                Check itinerary
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Check itinerary</DialogTitle>
                <DialogContent>
                  <p>
                    This records your assessment of the whole itinerary, not
                    just the visible days. It does not guarantee that the
                    itinerary is feasible.
                  </p>
                  {empty && (
                    <p>
                      No attractions or other items are scheduled. This marks
                      the empty itinerary as checked.
                    </p>
                  )}
                  {confirmationProblem && (
                    <Text role="status">{confirmationProblem}</Text>
                  )}
                </DialogContent>
                <DialogActions>
                  <DialogTrigger action="close" disableButtonEnhancement>
                    <Button>Cancel</Button>
                  </DialogTrigger>
                  <Button
                    appearance="primary"
                    disabledFocusable={!!confirmationProblem}
                    onClick={() => {
                      if (!confirmation || confirmationProblem) return;
                      setConfirmation(undefined);
                      void check.submit(confirmation);
                    }}
                  >
                    {empty ? "Mark empty itinerary checked" : "Mark as checked"}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
          {unavailableReason && (
            <>
              <span id={detailsId} className={classes.hidden}>
                {unavailableReason}
              </span>
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button appearance="subtle" size="small">
                    Check details
                  </Button>
                </PopoverTrigger>
                <PopoverSurface
                  aria-label="Check details"
                  className={classes.details}
                >
                  <Text>{unavailableReason}</Text>
                </PopoverSurface>
              </Popover>
            </>
          )}
          {check.unconfirmed && (
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowClockwise16Regular />}
              disabledFocusable={!!check.activity}
              onClick={() => void check.inspect()}
            >
              Inspect saved check state
            </Button>
          )}
          {(check.activity || check.message) && (
            <Caption1 role="status">
              {check.activity === "saving"
                ? "Saving check..."
                : check.activity === "inspecting"
                  ? "Loading saved check state..."
                  : check.message}
            </Caption1>
          )}
          {check.rejected && (
            <Button
              size="small"
              appearance="subtle"
              onClick={check.discardRejection}
            >
              Dismiss check error
            </Button>
          )}
        </>
      )}
    </div>
  );
}
