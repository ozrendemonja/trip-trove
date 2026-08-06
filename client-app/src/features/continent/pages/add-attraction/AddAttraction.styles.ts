import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  // TODO Repeating
  root: {
    ...shorthands.padding("12px"),
    maxWidth: "1200px",
    ...shorthands.borderRadius("30px"),
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    flexDirection: "column"
  },
  header: {
    fontSize: "30px",
    marginLeft: "25px",
    marginTop: "5px",
    fontWeight: "600"
  },
  headerDivider: {
    marginTop: "16px",
    marginBottom: "16px"
  },
  subHeader: {
    fontSize: "20px",
    marginTop: "10px",
    fontWeight: "600"
  },
  sectionDivider: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalS
  },
  attractionSectionDivider: {
    marginTop: tokens.spacingVerticalXXL,
    marginBottom: tokens.spacingVerticalM
  },
  row: {
    marginTop: tokens.spacingVerticalL
  },
  attractionName: {
    width: "90vh",
    maxWidth: "1200px"
  },
  inputToggle: {
    marginTop: "26px"
  },
  dropdowns: {
    width: 300
  },
  whereToVisit: {
    marginTop: "30px"
  },
  tip: {
    marginTop: tokens.spacingVerticalL
  },
  informationSourceRow: {
    marginTop: tokens.spacingVerticalL,
    alignItems: "flex-start",
    "& > :first-child": {
      width: "400px",
      maxWidth: "100%",
      flexBasis: "400px",
      flexGrow: 0,
      flexShrink: 0
    },
    "& > :last-child": {
      width: "300px",
      maxWidth: "100%",
      flexBasis: "300px",
      flexGrow: 0,
      flexShrink: 0
    }
  },
  informationSourceControl: {
    width: "100%",
    maxWidth: "none",
    marginTop: 0,
    marginLeft: 0,
    boxShadow: "none"
  },
  searchRootOverride: {
    width: "100%",
    maxWidth: "1200px"
  },
  checkbox: {
    marginTop: "15px"
  },
  formText: {
    maxWidth: "1200px",
    marginLeft: "25px"
  },
  formDropdown: {
    paddingTop: "15px",
    width: "300px"
  },
  saveError: {
    marginTop: "24px",
    marginLeft: "25px",
    maxWidth: "1200px"
  },
  searchBoxOverride: {
    width: "100%",
    maxWidth: "1200px",
    marginTop: 0,
    boxShadow: "none",
    marginLeft: 0
  },
  footer: {
    height: "40px",
    width: "100%",
    marginTop: "48px"
  }
});
