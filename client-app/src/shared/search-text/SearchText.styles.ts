import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  root: {
    width: "400px",
    maxWidth: "100%",
    minWidth: 0,
    position: "relative",
    "& > .fui-Field": {
      width: "100%",
      minWidth: 0,
      gridTemplateColumns: "minmax(0, 1fr)"
    }
  },
  inFlowRoot: {
    width: "100%",
    minWidth: 0
  },
  searchBox: {
    marginTop: "25px",
    boxShadow: tokens.shadow4,
    width: "100%"
  },
  dropdown: {
    width: "100%",
    ...shorthands.borderRadius("10px"),
    ...shorthands.borderColor(tokens.colorTransparentStroke),
    boxShadow: tokens.shadow8,
    zIndex: "333",
    position: "absolute",
    top: "100%",
    left: 0
  },
  inFlowSearchBox: {
    width: "100%",
    maxWidth: "400px",
    minWidth: 0
  },
  inFlowDropdown: {
    position: "static",
    width: "100%",
    maxWidth: "400px"
  },
  button: {
    width: "100%",
    ...shorthands.border("0px", "solid"),
    justifyContent: "flex-start",
    zIndex: "9999",
    textAlign: "left"
  },
  inFlowButton: {
    width: "100%"
  }
});
