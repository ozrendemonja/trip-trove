import { makeStyles, shorthands } from "@fluentui/react-components";

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
    fontSize: 24,
    ...shorthands.margin(0),
    ...shorthands.padding("12px", "16px", "8px")
  },
  legend: {
    display: "flex",
    ...shorthands.gap(16),
    ...shorthands.padding(0, "16px", "8px"),
    flexWrap: "wrap"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap(8),
    fontSize: 14
  },
  legendSwatch: {
    width: 16,
    height: 16,
    ...shorthands.borderRadius(3),
    ...shorthands.border("1px", "solid", "rgba(0,0,0,0.1)")
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
    ...shorthands.gap(4)
  },
  zoomButton: {
    width: "40px",
    height: "40px",
    ...shorthands.border("1px", "solid", "rgba(0,0,0,0.15)"),
    backgroundColor: "rgba(255,255,255,0.95)",
    ...shorthands.borderRadius(4),
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
    ":hover": {
      backgroundColor: "#fff"
    }
  },
  detailsPanel: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 320,
    maxHeight: "calc(100% - 24px)",
    overflowY: "auto",
    backgroundColor: "rgba(255,255,255,0.95)",
    ...shorthands.padding(16),
    ...shorthands.borderRadius(8),
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    zIndex: 3
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    ...shorthands.padding("6px", 0),
    ...shorthands.borderBottom("1px", "solid", "rgba(0,0,0,0.06)")
  },
  detailLabel: {
    color: "#444"
  },
  detailValue: {
    fontWeight: 600
  },
  placeholder: {
    color: "#666",
    fontStyle: "italic"
  },
  tooltip: {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 4,
    backgroundColor: "rgba(33, 33, 33, 0.92)",
    color: "#fff",
    ...shorthands.padding("4px", "8px"),
    ...shorthands.borderRadius(4),
    fontSize: 12,
    whiteSpace: "nowrap",
    transform: "translate(12px, 12px)"
  }
});

export const COLOR_GRAY = "#9aa0a6";
export const COLOR_YELLOW = "#FCE600";
export const COLOR_GOLD = "#f4b400";
export const COLOR_DEFAULT = "#FDEAD5";
