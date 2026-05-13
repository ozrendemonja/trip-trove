import { mergeStyleSets } from "@fluentui/react";

export const useClasses = () =>
  mergeStyleSets({
    container: {
      position: "absolute",
      top: 0,
      left: 220,
      right: 0,
      bottom: 0,
      padding: 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    },
    header: {
      fontSize: 24,
      margin: 0,
      padding: "12px 16px 8px"
    },
    legend: {
      display: "flex",
      gap: 16,
      padding: "0 16px 8px",
      flexWrap: "wrap"
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14
    },
    legendSwatch: {
      width: 16,
      height: 16,
      borderRadius: 3,
      border: "1px solid rgba(0,0,0,0.1)"
    },
    mapAndDetails: {
      position: "relative",
      flex: "1 1 auto",
      minHeight: 0
    },
    mapWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: "hidden",
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
        outline: "none"
      }
    },
    zoomControls: {
      position: "absolute",
      top: 8,
      left: 8,
      zIndex: 2,
      display: "flex",
      flexDirection: "column",
      gap: 4
    },
    zoomButton: {
      width: 32,
      height: 32,
      border: "1px solid rgba(0,0,0,0.15)",
      background: "rgba(255,255,255,0.95)",
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 18,
      fontWeight: 600,
      lineHeight: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      ":hover": {
        background: "#fff"
      }
    },
    detailsPanel: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 320,
      maxHeight: "calc(100% - 24px)",
      overflowY: "auto",
      background: "rgba(255,255,255,0.95)",
      padding: 16,
      borderRadius: 8,
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      zIndex: 3
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid rgba(0,0,0,0.06)"
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
      background: "rgba(33, 33, 33, 0.92)",
      color: "#fff",
      padding: "4px 8px",
      borderRadius: 4,
      fontSize: 12,
      whiteSpace: "nowrap",
      transform: "translate(12px, 12px)"
    }
  });

export const COLOR_GRAY = "#9aa0a6";
export const COLOR_YELLOW = "#fde293";
export const COLOR_GOLD = "#f4b400";
export const COLOR_DEFAULT = "#e6e6e6";
