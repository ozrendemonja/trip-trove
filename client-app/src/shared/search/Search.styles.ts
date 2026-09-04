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
  }
});
