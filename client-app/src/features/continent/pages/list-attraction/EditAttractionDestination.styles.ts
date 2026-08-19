import { makeStyles, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  sectionLabel: {
    textAlign: "end",
    fontSize: tokens.fontSizeBase500
  },
  switchLabel: {
    marginBottom: 0,
    fontSize: tokens.fontSizeBase300
  },
  searchField: {
    width: "100%",
    minWidth: 0,
    "& [role='grid']": {
      position: "static",
      width: "100%",
      maxWidth: "400px"
    },
    "& [role='menuitem']": {
      width: "100%"
    }
  },
  searchBox: {
    width: "100%",
    maxWidth: "400px",
    minWidth: 0
  }
});
