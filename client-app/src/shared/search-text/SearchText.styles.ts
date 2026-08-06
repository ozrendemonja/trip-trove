import { makeStyles, shorthands } from "@fluentui/react-components";

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
    boxShadow: "0 1px 6px 1px rgb(232, 228, 215)",
    width: "100%"
  },
  dropdown: {
    width: "100%",
    ...shorthands.borderRadius("10px"),
    ...shorthands.borderColor("transparent"),
    boxShadow: "0 4px 6px 1px rgba(232, 228, 215,.36)",
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
