import { makeStyles, shorthands } from "@fluentui/react-components";

export const useClasses = makeStyles({
  root: {
    height: "100%",
    "& > span:first-child": {
      ...shorthands.borderWidth("3px"),
      width: "128px",
      height: "128px"
    }
  }
});
