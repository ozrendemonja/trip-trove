import { makeStyles, tokens } from "@fluentui/react-components";

export const useDateRangePickerStyles = makeStyles({
  dateInput: {
    width: "100px",
    color: tokens.colorBrandBackground,
    backgroundColor: tokens.colorNeutralBackground1
  },
  arrowContainer: {
    padding: "5px"
  },
  arrow: {
    position: "relative",
    top: "calc(50% - 10px)",
    color: tokens.colorBrandBackground
  }
});
