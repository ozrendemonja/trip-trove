import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const useClasses = makeStyles({
  root: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap"
  },
  header: {
    fontSize: "30px",
    marginLeft: "25px",
    marginTop: "5px",
    fontWeight: tokens.fontWeightSemibold
  },
  dropdown: {
    marginTop: "25px",
    ...shorthands.borderColor(tokens.colorTransparentStroke),
    width: "200px",
    '& [role="combobox"]': {
      backgroundColor: tokens.colorNeutralBackground2,
      ...shorthands.borderRadius("10px"),
      ...shorthands.borderColor(tokens.colorTransparentStroke)
    }
  }
});

export default useClasses;
