import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  container: {
    position: "relative",
    minWidth: 0
  },
  searchBox: {
    marginTop: "25px",
    boxShadow: tokens.shadow4,
    borderBottomLeftRadius: "10px",
    borderBottomRightRadius: "10px",
    ...shorthands.borderColor(tokens.colorTransparentStroke),
    width: "400px"
  },
  dropdown: {
    top: "100%",
    left: 0,
    width: "100%",
    ...shorthands.borderRadius("10px"),
    ...shorthands.borderColor(tokens.colorTransparentStroke),
    boxShadow: tokens.shadow8,
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
