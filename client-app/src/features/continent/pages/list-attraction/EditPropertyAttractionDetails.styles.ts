import { makeStyles } from "@fluentui/react-components";

export const useClasses = makeStyles({
  fields: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "end",
    columnGap: "32px",
    rowGap: "16px",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      alignItems: "start"
    }
  },
  nameField: {
    minWidth: 0
  },
  attractionName: {
    width: "100%"
  },
  inputToggle: {
    alignSelf: "end",
    marginBottom: "4px",
    "@media (max-width: 600px)": {
      alignSelf: "start",
      marginBottom: 0
    }
  },
  mainAttractionField: {
    width: "100%",
    minWidth: 0,
    "& [role='grid']": {
      position: "static",
      width: "100%"
    },
    "& [role='menuitem']": {
      width: "100%"
    }
  },
  searchBox: {
    width: "100%",
    marginTop: 0,
    marginLeft: 0,
    boxShadow: "none"
  }
});
