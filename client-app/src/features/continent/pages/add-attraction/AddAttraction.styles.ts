import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  // TODO Repeating
  root: {
    ...shorthands.padding(tokens.spacingVerticalM),
    maxWidth: "1200px",
    boxSizing: "border-box",
    ...shorthands.borderRadius("30px"),
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    flexDirection: "column"
  },
  header: {
    fontSize: "30px",
    marginLeft: "25px",
    marginTop: "5px",
    fontWeight: tokens.fontWeightSemibold
  },
  headerDivider: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL
  },
  subHeader: {
    fontSize: tokens.fontSizeBase500,
    marginTop: tokens.spacingVerticalMNudge,
    fontWeight: tokens.fontWeightSemibold
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
  nameRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    columnGap: "48px",
    alignItems: "end",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      rowGap: tokens.spacingVerticalS
    }
  },
  addressRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 300px",
    columnGap: "48px",
    alignItems: "end",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      rowGap: tokens.spacingVerticalM
    }
  },
  attractionName: {
    width: "100%",
    maxWidth: "none"
  },
  geoLocation: {
    width: "100%"
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
  compactSwitch: {
    marginTop: "5px"
  },
  sectionSwitch: {
    marginTop: tokens.spacingVerticalMNudge
  },
  formContent: {
    marginLeft: "25px"
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
    marginTop: tokens.spacingVerticalXXL,
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
  },
  storyContainer: {
    width: "1000px"
  }
});
