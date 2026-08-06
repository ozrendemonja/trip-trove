import { makeStyles, shorthands } from "@fluentui/react-components";

export const useClasses = makeStyles({
  container: {
    position: "relative",
    minWidth: 0
  },
  searchBox: {
    marginTop: "25px",
    boxShadow: "0 1px 6px 1px rgb(232, 228, 215)",
    borderBottomLeftRadius: "10px",
    borderBottomRightRadius: "10px",
    ...shorthands.borderColor("transparent"),
    width: "400px"
  },
  dropdown: {
    top: "100%",
    left: 0,
    width: "100%",
    ...shorthands.borderRadius("10px"),
    ...shorthands.borderColor("transparent"),
    boxShadow: "0 4px 6px 1px rgba(232, 228, 215,.36)",
    zIndex: "333",
    position: "absolute"
  },
  button: {
    width: "100%",
    ...shorthands.border("0px", "solid"),
    justifyContent: "flex-start",
    textAlign: "left"
  }
});
