import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  // TODO Repeating
  root: {
    ...shorthands.padding(tokens.spacingVerticalM),
    maxHeight: "90vh",
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
    fontWeight: tokens.fontWeightSemibold
  },
  headerDivider: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL
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
  footer: {
    height: "40px",
    width: "100%",
    marginTop: "48px"
  }
});
