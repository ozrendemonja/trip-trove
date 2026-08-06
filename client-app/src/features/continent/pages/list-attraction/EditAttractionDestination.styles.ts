import { makeStyles } from "@fluentui/react-components";

export const useClasses = makeStyles({
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
