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
      right: 24,
      display: "flex",
      alignItems: "center",
      gap: 12
    },
    mapIconButton: {
      background: "transparent",
      border: "none",
      padding: 4,
      cursor: "pointer",
      borderRadius: 8,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      ":hover": {
        background: "rgba(255,255,255,0.4)"
      },
      ":focus": {
        outline: "2px solid #fec703",
        outlineOffset: 2
      }
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
