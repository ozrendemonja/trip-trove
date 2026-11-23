import {
  Badge,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Text
} from "@fluentui/react-components";
import { ArrowLeft24Regular } from "@fluentui/react-icons";
import {
  useEffect,
  useId,
  useMemo,
  type ReactElement,
  type ReactNode
} from "react";
import type { BoardMode } from "../AI-table/components/Board.types";
import {
  getShortcut,
  isShortcut,
  isTypingInFormField,
  keyComboFromEvent
} from "../AI-table/utils/Shortcuts";
import type { Trip } from "./domain/Trip.types";
import { useClasses } from "./TripHeader.styles";

interface TripHeaderProps {
  trip?: Trip;
  mode: BoardMode;
  onModeChange: (mode: BoardMode) => void;
  onBack: () => void;
  onSavePrepare?: () => void;
  hasEntryDraft?: boolean;
  planningBlocked?: boolean;
  actions?: ReactNode;
}

const STEPS = [
  {
    mode: "prepare",
    label: "Prepare",
    purpose: "Choose attractions",
    shortcut: "board.mode.prepare"
  },
  {
    mode: "edit",
    label: "Edit",
    purpose: "Add hours, lengths, notes",
    shortcut: "board.mode.edit"
  },
  {
    mode: "itinerary",
    label: "Itinerary",
    purpose: "Arrange the days",
    shortcut: "board.mode.itinerary"
  },
  {
    mode: "readOnly",
    label: "Plan",
    purpose: "See what's scheduled",
    shortcut: "board.mode.plan"
  },
  {
    mode: "review",
    label: "Review",
    purpose: "Rate visited attractions",
    shortcut: "board.mode.review"
  }
] as const;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC"
});

export const TripHeader = ({
  trip,
  mode,
  onModeChange,
  onBack,
  onSavePrepare,
  hasEntryDraft,
  planningBlocked,
  actions
}: TripHeaderProps): ReactElement => {
  const classes = useClasses();
  const descriptionId = useId();
  const steps = useMemo(
    () =>
      STEPS.map((step) => ({
        ...step,
        unavailableReason:
          hasEntryDraft && step.mode !== "itinerary"
            ? "Finish or cancel adding the attraction"
            : step.mode === "prepare" && mode !== "prepare" && planningBlocked
              ? "Finish pending change"
              : mode === "prepare" &&
                  (step.mode === "itinerary" ||
                    step.mode === "readOnly" ||
                    step.mode === "review")
                ? "After Edit"
                : step.mode === "review" &&
                    trip?.status !== "past" &&
                    trip?.status !== "archived"
                  ? "After the trip"
                  : undefined
      })),
    [mode, planningBlocked, trip?.status, hasEntryDraft]
  );
  const dates = trip?.startDate
    ? trip.endDate
      ? `${dateFormat.format(new Date(trip.startDate))} \u2013 ${dateFormat.format(new Date(trip.endDate))}`
      : `From ${dateFormat.format(new Date(trip.startDate))}`
    : "Dates not set";
  const days =
    trip?.startDate && trip.endDate
      ? (Date.parse(trip.endDate) - Date.parse(trip.startDate)) / 86_400_000 + 1
      : undefined;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return;
      const combo = keyComboFromEvent(event);
      if (isShortcut("form.save", combo)) {
        event.preventDefault();
        if (mode === "prepare") onSavePrepare?.();
        return;
      }
      if (isTypingInFormField(event.target)) return;

      const step = steps.find((item) => isShortcut(item.shortcut, combo));
      if (step) {
        event.preventDefault();
        if (!step.unavailableReason) onModeChange(step.mode);
      } else if (isShortcut("board.mode.cycle", combo)) {
        event.preventDefault();
        const available = steps.filter((item) => !item.unavailableReason);
        const currentIndex = available.findIndex((item) => item.mode === mode);
        onModeChange(available[(currentIndex + 1) % available.length].mode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, onModeChange, onSavePrepare, steps]);

  return (
    <Card className={classes.card} role="region" aria-label="Trip overview">
      <CardHeader
        className={classes.topRow}
        image={{
          className: classes.backNavigation,
          children: (
            <>
              <Button
                appearance="subtle"
                aria-label="My Trips"
                icon={<ArrowLeft24Regular />}
                onClick={onBack}
                className={classes.backButton}
              >
                <span className={classes.backLabel}>My Trips</span>
              </Button>
              <Divider vertical className={classes.backDivider} />
            </>
          )
        }}
        header={{
          className: classes.identity,
          children: (
            <Text
              as="h1"
              size={500}
              weight="semibold"
              className={classes.name}
              title={trip?.name ?? "Trip Planner"}
            >
              {trip?.name ?? "Trip Planner"}
            </Text>
          )
        }}
        description={{
          className: classes.dates,
          children: (
            <>
              <Caption1>{dates}</Caption1>
              {days !== undefined && (
                <>
                  <Caption1 aria-hidden="true">&middot;</Caption1>
                  <Caption1>
                    {days} {days === 1 ? "day" : "days"}
                  </Caption1>
                </>
              )}
            </>
          )
        }}
        action={
          actions
            ? { children: actions, className: classes.actions }
            : undefined
        }
      />
      <nav aria-label="Trip steps">
        <ol className={classes.steps}>
          {steps.map((step, index) => (
            <li key={step.mode} className={classes.step}>
              <Button
                appearance="subtle"
                className={classes.stepButton}
                aria-label={step.label}
                aria-describedby={`${descriptionId}-${step.mode}`}
                aria-current={mode === step.mode ? "step" : undefined}
                disabled={!!step.unavailableReason}
                title={`${step.label} (${getShortcut(step.shortcut)})`}
                onClick={() => onModeChange(step.mode)}
              >
                <Badge
                  size="small"
                  appearance={mode === step.mode ? "filled" : "outline"}
                  color="important"
                  className={classes.number}
                  aria-hidden="true"
                >
                  {index + 1}
                </Badge>
                <span className={classes.stepText}>
                  <Text weight={mode === step.mode ? "semibold" : "regular"}>
                    {step.label}
                  </Text>
                  <Caption1
                    className={classes.purpose}
                    id={`${descriptionId}-${step.mode}`}
                  >
                    {step.unavailableReason ?? step.purpose}
                  </Caption1>
                </span>
              </Button>
              {index < steps.length - 1 && (
                <Divider className={classes.stepConnector} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </Card>
  );
};
