import { mergeStyleSets } from "@fluentui/react";

export const useClasses = () =>
  mergeStyleSets({
    linkField: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%"
    },
    filterElementSelected: {
      color: "black",
      fontWeight: "bold"
    },
    filterElementNotSelected: {
      color: "grey"
    }
  });
