import { makeStyles, tokens } from "@fluentui/react-components";

export const DAY_COLUMN_MIN_WIDTH = 208;
export const DAY_COLUMN_GAP = 12;

export const useClasses = makeStyles({
  pager: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalXXS
  },
  dateList: {
    maxHeight: "min(360px, 60vh)",
    overflowY: "auto"
  },
  itinerary: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
    rowGap: tokens.spacingVerticalM
  },
  itineraryColumns: {
    display: "grid",
    flexGrow: 1,
    gridTemplateColumns: "minmax(0, 232px) minmax(0, 1fr)",
    gap: `${DAY_COLUMN_GAP}px`,
    "@media (max-width: 600px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateRows: "auto 1fr"
    }
  },
  pool: {
    minWidth: 0,
    alignSelf: "start",
    maxHeight: "70dvh",
    overflowY: "auto",
    overflowWrap: "anywhere",
    "@media (max-width: 600px)": {
      maxHeight: "42dvh"
    }
  },
  poolHeading: {
    margin: 0
  },
  poolPrepare: {
    minWidth: 0,
    maxWidth: "100%",
    whiteSpace: "normal"
  },
  poolLegend: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2
  },
  poolGroup: {
    display: "grid",
    minWidth: 0,
    gap: tokens.spacingVerticalXS
  },
  poolCards: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyleType: "none",
    gap: tokens.spacingVerticalXS
  },
  poolCard: {
    minWidth: 0,
    ":focus-visible": {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: "-2px"
    }
  },
  poolCardHeader: {
    rowGap: tokens.spacingVerticalXXS
  },
  poolName: {
    display: "flex",
    alignItems: "baseline",
    columnGap: tokens.spacingHorizontalXS,
    "& svg": { flexShrink: 0, alignSelf: "center" }
  },
  poolFacts: {
    display: "flex",
    flexDirection: "column",
    color: tokens.colorNeutralForeground2
  },
  star: { color: tokens.colorStatusWarningForeground1 },
  ring: { color: tokens.colorNeutralForeground1 },
  faint: { color: tokens.colorNeutralStroke1Pressed },
  visuallyHidden: {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap"
  },
  dayRow: {
    display: "grid",
    flexGrow: 1,
    minWidth: 0,
    minHeight: "180px",
    gap: `${DAY_COLUMN_GAP}px`
  },
  day: {
    minWidth: 0
  },
  dayHeading: {
    margin: 0,
    textAlign: "center"
  },
  dayLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXXS
  },
  dateNumber: {
    display: "grid",
    placeItems: "center",
    width: "34px",
    height: "34px",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3
  }
});
