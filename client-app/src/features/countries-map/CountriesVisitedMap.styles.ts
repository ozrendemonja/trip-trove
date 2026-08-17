import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  container: {
    position: "absolute",
    ...shorthands.inset(0, 0, 0, "220px"),
    ...shorthands.padding(0),
    ...shorthands.overflow("hidden"),
    display: "flex",
    flexDirection: "column"
  },
  header: {
    fontSize: tokens.fontSizeBase600,
    ...shorthands.margin(0),
    ...shorthands.padding(
      tokens.spacingVerticalM,
      tokens.spacingHorizontalL,
      tokens.spacingVerticalS
    )
  },
  legend: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalL),
    ...shorthands.padding(
      0,
      tokens.spacingHorizontalL,
      tokens.spacingVerticalS
    ),
    flexWrap: "wrap"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap(tokens.spacingHorizontalS),
    fontSize: tokens.fontSizeBase300
  },
  legendSwatch: {
    width: 16,
    height: 16,
    ...shorthands.borderRadius(3),
    ...shorthands.border(
      tokens.strokeWidthThin,
      "solid",
      tokens.colorNeutralStroke2
    )
  },
  mapAndDetails: {
    position: "relative",
    ...shorthands.flex(1, 1, "auto"),
    minHeight: 0
  },
  mapWrapper: {
    position: "absolute",
    ...shorthands.inset(0),
    ...shorthands.overflow("hidden"),
    cursor: "grab",
    ":active": {
      cursor: "grabbing"
    },
    // react-simple-maps renders an <svg>; force it to fill the wrapper.
    "& > svg": {
      width: "100%",
      height: "100%",
      display: "block",
      shapeRendering: "geometricPrecision"
    },
    // Keep country borders 1 screen-pixel thick at every zoom level so the
    // ZoomableGroup transform does not produce sub-pixel / blurry strokes.
    "& svg path": {
      vectorEffect: "non-scaling-stroke",
      ...shorthands.outline("medium", "none", "currentColor")
    }
  },
  zoomControls: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalXS)
  },
  zoomButton: {
    width: "40px",
    height: "40px",
    ...shorthands.border(
      tokens.strokeWidthThin,
      "solid",
      tokens.colorNeutralStroke1
    ),
    backgroundColor: tokens.colorNeutralBackgroundAlpha2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    cursor: "pointer",
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: tokens.shadow4,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1
    }
  },
  detailsPanel: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 320,
    maxHeight: "calc(100% - 24px)",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackgroundAlpha2,
    ...shorthands.padding(tokens.spacingVerticalL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow8,
    zIndex: 3
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    ...shorthands.padding(tokens.spacingVerticalSNudge, 0),
    ...shorthands.borderBottom(
      tokens.strokeWidthThin,
      "solid",
      tokens.colorNeutralStroke2
    )
  },
  detailLabel: {
    color: tokens.colorNeutralForeground1
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold
  },
  placeholder: {
    color: tokens.colorNeutralForeground2,
    fontStyle: "italic"
  },
  tooltip: {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 4,
    backgroundColor: tokens.colorNeutralBackgroundInverted,
    color: tokens.colorNeutralForegroundInverted,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase200,
    whiteSpace: "nowrap",
    transform: "translate(12px, 12px)"
  }
});

export const COLOR_GRAY = "#9aa0a6";
export const COLOR_YELLOW = "#FCE600";
export const COLOR_GOLD = "#f4b400";
export const COLOR_DEFAULT = "#FDEAD5";
