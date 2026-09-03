import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useAutocompleteClasses = makeStyles({
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
  suggestion: {
    width: "100%",
    ...shorthands.border("0px", "solid"),
    justifyContent: "flex-start",
    textAlign: "left"
  }
});
