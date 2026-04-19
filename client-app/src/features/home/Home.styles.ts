import { mergeStyleSets } from "@fluentui/react";

export const useClasses = () => {
  const defaultSearchOption = {
    marginRight: 12,
    marginBottom: -10
  };

  return mergeStyleSets({
    notSelectedSearchOption: {
      ...defaultSearchOption,
      textDecoration: "underline",
      ":focus, :active, :hover": {
        color: "black",
        textDecoration: undefined
      }
    },
    selectedSearchOption: {
      ...defaultSearchOption,
      color: "black",
      textDecoration: undefined,
      fontWeight: "bold",
      ":focus, :active, :hover": {
        color: "black",
        textDecoration: undefined
      }
    },
    searchContiner: {
      position: "absolute",
      left: "50%"
    },
    gaugeContainer: {
      position: "absolute",
      top: 10,
      right: 24
    },
    headerRow: {
      fontSize: 40,
      paddingBottom: "20px",
      paddingLeft: "20%"
    },
    headerIcon: {
      paddingTop: "12%"
    },
    headerText: {
      fontSize: 40,
      marginLeft: 15
    }
  });
};
