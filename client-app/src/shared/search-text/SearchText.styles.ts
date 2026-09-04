import { makeStyles, tokens } from "@fluentui/react-components";

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
    zIndex: "9999"
  },
  inFlowButton: {
    width: "100%"
  }
});
