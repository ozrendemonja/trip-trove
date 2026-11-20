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
