import { Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { Warning16Regular } from "@fluentui/react-icons";
import type { ReactElement } from "react";
import type { AttractionEntry } from "../../clients/manager";

export type EntryWarning = AttractionEntry["warnings"][number];

export const entryWarningLabels: Record<EntryWarning, string> = {
  PERMANENTLY_CLOSED: "Permanently closed",
  PLANNED_LENGTH_OUTSIDE_SOURCE_RANGE:
    "Planned length is outside the current visit duration range.",
  UNUSABLE_SOURCE_DURATION: "Missing or invalid visit duration.",
  MISSING_TRANSFER: "Missing transfer"
};

export const warningCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "warning" : "warnings"}`;

const useStyles = makeStyles({
  warning: {
    display: "inline-flex",
    alignItems: "flex-start",
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorStatusWarningForeground3,
    "& svg": { flexShrink: 0 }
  }
});

export function ItineraryWarning({
  children
}: {
  children: string;
}): ReactElement {
  const classes = useStyles();
  return (
    <Caption1 className={classes.warning}>
      <Warning16Regular aria-hidden />
      <span>{children}</span>
    </Caption1>
  );
}
