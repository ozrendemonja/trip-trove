import { makeStyles, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  fields: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 192px",
    alignItems: "start",
    columnGap: "48px",
    rowGap: tokens.spacingVerticalL,
    "@media (max-width: 600px)": {
      gridTemplateColumns: "minmax(0, 1fr)"
    }
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
  },
  dateField: {
    minWidth: 0,
    "& > .fui-Field": {
      width: "100%",
      minWidth: 0,
      gridTemplateColumns: "minmax(0, 1fr)"
    }
  },
  dateInput: {
    width: "100%",
    minWidth: 0
  }
});
