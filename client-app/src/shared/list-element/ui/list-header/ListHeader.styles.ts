import { makeStyles, shorthands } from "@fluentui/react-components";

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
    fontWeight: "600"
  },
  dropdown: {
    marginTop: "25px",
    ...shorthands.borderColor("transparent"),
    width: "200px",
    '& [role="combobox"]': {
      backgroundColor: "#F9FBFF",
      ...shorthands.borderRadius("10px"),
      ...shorthands.borderColor("transparent")
    }
  }
});

export default useClasses;
