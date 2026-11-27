import {
  Button,
  Caption1,
  Caption1Strong,
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
  useId,
  useModalAttributes
} from "@fluentui/react-components";
import {
  Alert16Regular,
  ArrowClockwise16Regular,
  Warning16Regular
} from "@fluentui/react-icons";
import { useState, type ReactElement } from "react";
import type {
  ChangeNotice,
  GetItineraryResponse,
  SourceChange
} from "../../clients/manager";
import {
  formatVisitPeriod,
  readableFactValue,
  recordedFactValue
} from "./AttractionFactsDialog";
import { formatItineraryDate, type ItineraryTarget } from "./Itinerary";
import { useClasses as useItineraryStyles } from "./Itinerary.styles";
import {
  entryWarningLabels,
  ItineraryWarning,
  warningCountLabel,
  type EntryWarning
} from "./ItineraryWarning";
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
  REMOVED_FROM_TRIP: "Removed from the trip",
  TRANSFER_CHANGED: "Transfer changed",
  GROUP_CHANGED: "Grouped attractions changed"
};
const sourceFieldLabels: Record<SourceChange["field"], string> = {
  WORKING_HOURS: "Working hours",
  VISIT_DURATION: "Visit duration",
  MUST_VISIT: "Must-visit",
  IMPORTANCE: "Importance",
  TRIP_NOTE: "Trip note",
  ADDRESS: "Address",
  LOCATION: "Location",
  GEOGRAPHY: "Geography",
  MAIN_ATTRACTION: "Main attraction",
  CATEGORY: "Category",
  TYPE: "Type",
  CATALOGUE_TIP: "Catalogue tip",
  OPTIMAL_VISIT_PERIOD: "Optimal visit period",
  PERMANENT_CLOSURE: "Permanent closure"
};
const baselineLabels: Record<
  NonNullable<ChangeNotice["sourceBaseline"]>,
  string
> = {
  WHEN_SCHEDULED: "When scheduled",
  AT_LAST_CHECK: "At last check"
};

const sourceValue = (field: SourceChange["field"], value?: string): string => {
  switch (field) {
    case "MAIN_ATTRACTION":
      return value ?? "None";
    case "OPTIMAL_VISIT_PERIOD": {
      const [from, to] = value?.split("/") ?? [];
      return formatVisitPeriod(from, to);
    }
    case "CATEGORY":
    case "TYPE":
    case "MUST_VISIT":
    case "IMPORTANCE":
    case "PERMANENT_CLOSURE":
      return value === undefined
        ? recordedFactValue()
        : readableFactValue(value);
    default:
      return recordedFactValue(value);
  }
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
  reasons: { margin: 0, paddingInlineStart: tokens.spacingHorizontalL },
  sourceChanges: {
    display: "grid",
    gap: tokens.spacingVerticalS,
    listStyleType: "none",
    margin: 0,
    padding: 0,
    width: "100%"
  }
});

type DetailTab = "changes" | "warnings";

type WarningRow = {
  entryId: number;
  attractionId: number;
  date: string;
  subject: string;
  warning: EntryWarning;
};

const warningRows = (itinerary?: GetItineraryResponse): WarningRow[] =>
  itinerary?.days.flatMap((day) =>
    day.entries.flatMap((entry, index) => [
      ...entry.warnings.map((warning) => ({
        entryId: entry.entryId,
        attractionId: entry.attractionId,
        date: day.date,
        subject:
          warning === "MISSING_TRANSFER" && day.entries[index + 1]
            ? `${entry.name} to ${day.entries[index + 1].name}`
            : entry.name,
        warning
      })),
      ...(entry.groupedAttractions?.flatMap((member) =>
        member.warnings.map((warning) => ({
          entryId: entry.entryId,
          attractionId: member.attractionId,
          date: day.date,
          subject: member.name,
          warning
        }))
      ) ?? [])
    ])
  ) ?? [];

function WarningRows({
  rows,
  onJump,
  jumpBlocked
}: {
  rows: WarningRow[];
  onJump?: (target: ItineraryTarget) => void;
  jumpBlocked?: boolean;
}): ReactElement {
  const classes = useStyles();
  return (
    <ul className={classes.notices}>
      {rows.map((row) => (
        <li
          className={classes.notice}
          key={`${row.attractionId}:${row.warning}`}
        >
          <Text weight="semibold">{row.subject}</Text>
          <Caption1>{formatItineraryDate(row.date)}</Caption1>
          <ItineraryWarning>{entryWarningLabels[row.warning]}</ItineraryWarning>
          {onJump && (
            <DialogTrigger action="close" disableButtonEnhancement>
              <Button
                size="small"
                disabledFocusable={jumpBlocked}
                onClick={() => onJump(row)}
              >
                Go to entry
              </Button>
            </DialogTrigger>
          )}
        </li>
      ))}
    </ul>
  );
}

function SourceChanges({
  baseline,
  changes
}: {
  baseline: NonNullable<ChangeNotice["sourceBaseline"]>;
  changes: SourceChange[];
}): ReactElement {
  const classes = useStyles();
  const { factsList } = useItineraryStyles();
  return (
    <ul className={classes.sourceChanges}>
      {changes.map((change) => (
        <li key={change.field}>
          <Caption1Strong block>
            {sourceFieldLabels[change.field]}
          </Caption1Strong>
          <dl className={factsList}>
            <dt>
              <Caption1Strong>{baselineLabels[baseline]}</Caption1Strong>
            </dt>
            <dd>
              <Caption1>{sourceValue(change.field, change.baseline)}</Caption1>
            </dd>
            <dt>
              <Caption1Strong>Current value</Caption1Strong>
            </dt>
            <dd>
              <Caption1>{sourceValue(change.field, change.current)}</Caption1>
            </dd>
          </dl>
          {change.restored && (
            <Caption1 block>Changed in between and restored.</Caption1>
          )}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  saved?: GetItineraryResponse;
  failed: boolean;
  loading: boolean;
  showAction: boolean;
  unavailableReason?: string;
  jumpBlocked: boolean;
  check: ReturnType<typeof useItineraryCheck>;
  onJump: (target: ItineraryTarget) => void;
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
  const { triggerAttributes } = useModalAttributes();
  const detailsId = useId("check-availability");
  const changesId = useId("check-changes");
  const warningsId = useId("check-warnings");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tab, setTab] = useState<DetailTab>("changes");
  const [confirmation, setConfirmation] = useState<GetItineraryResponse>();
  usePlanningDraft(!!confirmation, () => setConfirmation(undefined));
  const notices = saved?.changeNotices ?? [];
  const warnings = warningRows(saved);
  const acceptingWarnings = warningRows(confirmation);
  const empty = confirmation?.days.every((day) => day.entries.length === 0);
  const confirmationProblem =
    unavailableReason ??
    (confirmation !== saved
      ? "The saved itinerary was refreshed. Close this dialog and confirm again."
      : undefined);

  const openDetails = (target: DetailTab): void => {
    setTab(target);
    setDetailsOpen(true);
  };

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
        <Button
          {...triggerAttributes}
          size="small"
          appearance="outline"
          aria-haspopup="dialog"
          icon={<Alert16Regular />}
          className={classes.changes}
          onClick={() => openDetails("changes")}
        >
          {notices.length} {notices.length === 1 ? "change" : "changes"} to
          check
        </Button>
      )}
      {warnings.length > 0 && (
        <Button
          {...triggerAttributes}
          size="small"
          appearance="outline"
          aria-haspopup="dialog"
          icon={<Warning16Regular />}
          onClick={() => openDetails("warnings")}
        >
          {warningCountLabel(warnings.length)}
          {saved?.checkState === "MANUALLY_CHECKED" &&
            (warnings.length === 1 ? " remains" : " remain")}
        </Button>
      )}
      {(detailsOpen || notices.length > 0 || warnings.length > 0) && (
        <Dialog
          open={detailsOpen}
          onOpenChange={(_event, info) => setDetailsOpen(info.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Itinerary check details</DialogTitle>
              <DialogContent>
                <TabList
                  selectedValue={tab}
                  onTabSelect={(_event, { value }) => {
                    if (value !== "changes" && value !== "warnings") {
                      throw new Error("Unknown itinerary check details tab.");
                    }
                    setTab(value);
                  }}
                  aria-label="Check information"
                >
                  <Tab
                    value="changes"
                    id={changesId}
                    aria-controls={`${changesId}-panel`}
                  >
                    Changes to check ({notices.length})
                  </Tab>
                  <Tab
                    value="warnings"
                    id={warningsId}
                    aria-controls={`${warningsId}-panel`}
                  >
                    Warnings ({warnings.length})
                  </Tab>
                </TabList>
                <div
                  role="tabpanel"
                  id={`${changesId}-panel`}
                  aria-labelledby={changesId}
                  hidden={tab !== "changes"}
                >
                  {notices.length === 0 && <p>No changes to check.</p>}
                  <ul className={classes.notices}>
                    {notices.map((notice, index) => {
                      const sourceBaseline = notice.sourceBaseline;
                      return (
                        <li
                          key={
                            notice.entryId ??
                            `${notice.date}:${notice.subject}:${index}`
                          }
                          className={classes.notice}
                        >
                          <Text weight="semibold">{notice.subject}</Text>
                          <Caption1>
                            {formatItineraryDate(notice.date)}
                          </Caption1>
                          {notice.reasons.length > 0 && (
                            <ul className={classes.reasons}>
                              {notice.reasons.map((reason) => (
                                <li key={reason}>{reasonLabels[reason]}</li>
                              ))}
                            </ul>
                          )}
                          {sourceBaseline && notice.sourceChanges && (
                            <SourceChanges
                              baseline={sourceBaseline}
                              changes={notice.sourceChanges}
                            />
                          )}
                          {notice.groupedSourceChanges?.map((member) => (
                            <div key={member.attractionId}>
                              <Caption1Strong block>
                                {member.subject}
                              </Caption1Strong>
                              <SourceChanges
                                baseline={member.sourceBaseline}
                                changes={member.sourceChanges}
                              />
                            </div>
                          ))}
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
                      );
                    })}
                  </ul>
                </div>
                <div
                  role="tabpanel"
                  id={`${warningsId}-panel`}
                  aria-labelledby={warningsId}
                  hidden={tab !== "warnings"}
                >
                  {warnings.length > 0 ? (
                    <WarningRows
                      rows={warnings}
                      onJump={onJump}
                      jumpBlocked={jumpBlocked}
                    />
                  ) : (
                    <p>No current-condition warnings.</p>
                  )}
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
                  {acceptingWarnings.length > 0 && (
                    <>
                      <p>
                        Accepting these warnings does not repair or retime
                        anything.
                      </p>
                      <WarningRows rows={acceptingWarnings} />
                    </>
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
                    {acceptingWarnings.length > 0
                      ? "Accept warnings and mark checked"
                      : empty
                        ? "Mark empty itinerary checked"
                        : "Mark as checked"}
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
          {check.requiresRefresh && (
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowClockwise16Regular />}
              disabledFocusable={loading}
              onClick={onRetry}
            >
              Refresh before checking
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
