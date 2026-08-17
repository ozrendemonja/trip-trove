import { makeStyles, tokens } from "@fluentui/react-components";

const GAUGE_SIZE = 110;
const STROKE_WIDTH = 10;
const CENTER = GAUGE_SIZE / 2;

export { GAUGE_SIZE, STROKE_WIDTH };
export const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
export const CENTER_Y = CENTER;

export const useClasses = makeStyles({
  svgContainer: {
    position: "relative",
    width: `${GAUGE_SIZE}px`,
    height: `${CENTER + 6}px`
  },
  labelContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: "center"
  },
  valueText: {
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1
  },
  subtitleText: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS
  }
});
