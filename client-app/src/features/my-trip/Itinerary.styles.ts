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
  unscheduledAttractions: {
    minWidth: 0,
    alignSelf: "start",
    maxHeight: "70dvh",
    overflowY: "auto",
    overflowWrap: "anywhere",
    "@media (max-width: 600px)": {
      maxHeight: "42dvh"
    }
  },
  unscheduledHeading: {
    margin: 0
  },
  unscheduledPrepare: {
    minWidth: 0,
    maxWidth: "100%",
    whiteSpace: "normal"
  },
  unscheduledLegend: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2
  },
  unscheduledGroup: {
    display: "grid",
    minWidth: 0,
    gap: tokens.spacingVerticalXS
  },
  unscheduledCards: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyleType: "none",
    gap: tokens.spacingVerticalXS
  },
  unscheduledCard: {
    minWidth: 0,
    ":focus-visible": {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: "-2px"
    }
  },
  unscheduledCardHeader: {
    rowGap: tokens.spacingVerticalXXS
  },
  attractionName: {
    minWidth: 0,
    padding: 0,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    overflowWrap: "anywhere",
    textAlign: "start",
    justifyContent: "start"
  },
  iconLabel: {
    display: "flex",
    alignItems: "baseline",
    columnGap: tokens.spacingHorizontalXS,
    "& svg": { flexShrink: 0, alignSelf: "center" }
  },
  dragHandle: {
    display: "inline-flex",
    flexShrink: 0,
    alignSelf: "center",
    padding: tokens.spacingHorizontalXXS,
    touchAction: "none",
    "[draggable='true'] &": { cursor: "grab" }
  },
  dragPreview: {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1,
    pointerEvents: "none",
    maxWidth: "min(240px, 90vw)",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    boxShadow: tokens.shadow8,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    overflowWrap: "anywhere"
  },
  unscheduledFacts: {
    display: "flex",
    flexDirection: "column",
    color: tokens.colorNeutralForeground2
  },
  factsSections: {
    display: "grid",
    rowGap: tokens.spacingVerticalM,
    overflowWrap: "anywhere"
  },
  factsList: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
    gap: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    margin: `${tokens.spacingVerticalXS} 0 0`,
    "& dd": { margin: 0, whiteSpace: "pre-wrap" }
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
    minWidth: 0,
    overflowWrap: "anywhere"
  },
  hiddenDragSource: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
    width: 0,
    height: 0,
    overflow: "hidden"
  },
  dropOnEmptyDay: { outline: `2px solid ${tokens.colorBrandStroke1}` },
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
  noteControl: {
    display: "grid",
    justifyItems: "start",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  note: {
    width: "100%",
    boxSizing: "border-box",
    paddingBlockStart: tokens.spacingVerticalS
  },
  notePreview: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    overflow: "hidden"
  },
  noteForm: {
    display: "grid",
    rowGap: tokens.spacingVerticalS,
    "& textarea": { whiteSpace: "pre-wrap" }
  },
  dateNumber: {
    display: "grid",
    placeItems: "center",
    width: "34px",
    height: "34px",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3
  },
  timeline: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyleType: "none",
    rowGap: tokens.spacingVerticalXXS
  },
  transferLine: {
    justifySelf: "start",
    minWidth: 0,
    whiteSpace: "normal",
    textAlign: "start",
    overflowWrap: "anywhere"
  },
  entry: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    columnGap: tokens.spacingHorizontalS,
    ":focus-visible": {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: "2px"
    }
  },
  clocks: {
    display: "grid",
    alignContent: "center",
    width: "76px",
    color: tokens.colorNeutralForeground2,
    fontVariantNumeric: "tabular-nums"
  },
  clockInput: {
    minWidth: 0,
    width: "100%",
    fontVariantNumeric: "tabular-nums",
    "& input": { minWidth: 0 }
  },
  endClock: {
    ":focus-within": {
      position: "relative",
      zIndex: 1,
      width: "20ch",
      backgroundColor: tokens.colorNeutralBackground1
    }
  },
  entryCard: {
    minWidth: 0
  },
  entryHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalXS
  },
  entryActions: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center"
  },
  positionFields: {
    display: "grid",
    rowGap: tokens.spacingVerticalM
  },
  plannedLength: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalXS,
    "& > span:last-child": { width: "80px", maxWidth: "100%" }
  },
  entryMessage: {
    gridColumn: "1 / -1",
    marginTop: tokens.spacingVerticalXS
  },
  entryError: {
    color: tokens.colorStatusDangerForeground1
  },
  freeTime: {
    color: tokens.colorNeutralForeground2,
    borderInlineStartColor: tokens.colorNeutralStroke2,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
    paddingInlineStart: tokens.spacingHorizontalS
  },
  dropSlot: {
    minHeight: "6px",
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "transparent"
  },
  activeDropSlot: {
    borderBlockStartColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2
  },
  entryDraft: {
    display: "grid",
    minWidth: 0,
    rowGap: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalS,
    "& input": { minWidth: 0 }
  },
  draftActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS
  }
});
