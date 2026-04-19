import { ITheme, mergeStyleSets } from "@fluentui/react";

const GAUGE_SIZE = 110;
const STROKE_WIDTH = 10;
const CENTER = GAUGE_SIZE / 2;

export { GAUGE_SIZE, STROKE_WIDTH };
export const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
export const CENTER_Y = CENTER;

export const useClasses = (theme: ITheme) => {
  return mergeStyleSets({
    svgContainer: {
      position: "relative",
      width: GAUGE_SIZE,
      height: CENTER + 6
    },
    labelContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      textAlign: "center"
    },
    valueText: {
      fontWeight: 700,
      color: theme.palette.neutralPrimary
    },
    subtitleText: {
      color: theme.palette.neutralSecondary,
      marginTop: 2
    }
  });
};
