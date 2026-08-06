import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  // TODO Repeating
  root: {
    ...shorthands.padding("12px"),
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
    fontWeight: "600"
  },
  headerDivider: {
    marginTop: "16px",
    marginBottom: "16px"
  },
  form: {
    maxWidth: "600px",
    marginLeft: "25px"
  },
  saveError: {
    marginTop: "24px",
    marginLeft: "25px",
    maxWidth: "1200px"
  },
  footer: {
    height: "40px",
    width: "100%",
    marginTop: "48px"
  }
});
