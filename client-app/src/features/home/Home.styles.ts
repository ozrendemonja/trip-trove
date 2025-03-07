import { mergeStyleSets } from "@fluentui/react";

export const useClasses = () => {
  const defaultSearchOption = {
    marginRight: 12,
    marginBottom: -10
  };

  return mergeStyleSets({
    notSelectedSearchOption: {
      ...defaultSearchOption,
      textDecoration: "underline"
    },
    selectedSearchOption: {
      ...defaultSearchOption,
      color: "black",
      textDecoration: undefined,
      fontWeight: "bold",
      ":focus, :active": {
        color: "black"
      }
    }
  });
};
