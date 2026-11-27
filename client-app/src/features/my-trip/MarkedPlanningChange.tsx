import {
  Button,
  Spinner,
  Text,
  Tooltip,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { ArrowClockwise16Regular } from "@fluentui/react-icons";
import type { PlanningFeedback } from "./useTripPlanningSave";
import type { ReactElement } from "react";

const useStyles = makeStyles({
  feedback: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`
  },
  problem: { color: tokens.colorPaletteRedForeground1 }
});

interface Props {
  feedback: Pick<
    PlanningFeedback,
    "state" | "message" | "refreshing" | "unconfirmed"
  > & {
    proposal: Pick<PlanningFeedback["proposal"], "description" | "subjectName">;
  };
  onReload?: () => void;
  onDiscard?: () => void;
  onReviewRemoval?: () => void;
}

const labels = {
  saving: "Saving",
  saved: "Saved",
  error: "Save problem"
};

export const MarkedPlanningChange = ({
  feedback,
  onReload,
  onDiscard,
  onReviewRemoval
}: Props): ReactElement => {
  const classes = useStyles();
  const { state, proposal, message, refreshing, unconfirmed } = feedback;
  const problem = state !== "saving" && state !== "saved";
  return (
    <div
      role="status"
      aria-label={`Marked change for ${proposal.subjectName}`}
      className={classes.feedback}
    >
      {(state === "saving" || refreshing) && <Spinner size="extra-tiny" />}
      <Tooltip content={proposal.description} relationship="description">
        <Text
          size={200}
          weight="semibold"
          tabIndex={0}
          className={problem ? classes.problem : undefined}
        >
          {unconfirmed ? "Unconfirmed" : labels[state]}
        </Text>
      </Tooltip>
      <Text size={200}>{message ?? proposal.description}</Text>
      {unconfirmed && onReload && (
        <Tooltip content="Reload saved planning" relationship="label">
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowClockwise16Regular />}
            disabled={refreshing}
            onClick={onReload}
          />
        </Tooltip>
      )}
      {state === "error" && !unconfirmed && onDiscard && (
        <Button size="small" appearance="subtle" onClick={onDiscard}>
          Discard change
        </Button>
      )}
      {onReviewRemoval && (
        <Button size="small" appearance="subtle" onClick={onReviewRemoval}>
          Review itinerary consequences
        </Button>
      )}
    </div>
  );
};
