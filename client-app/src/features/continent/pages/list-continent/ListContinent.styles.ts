import { mergeStyleSets } from "@fluentui/react";

export const useClasses = () =>
  mergeStyleSets({
    linkField: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%"
    }
  });
