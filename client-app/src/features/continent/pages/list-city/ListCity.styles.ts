import { makeStyles, shorthands } from "@fluentui/react-components";

export const useClasses = makeStyles({
  linkField: {
    ...shorthands.overflow("hidden"),
    textOverflow: "ellipsis",
    maxWidth: "100%"
  }
});
