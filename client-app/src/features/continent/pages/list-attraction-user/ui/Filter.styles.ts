import { FontWeights, getTheme, mergeStyleSets } from "@fluentui/react";

export const useClasses = () => {
  const theme = getTheme();

  return mergeStyleSets({
    container: {
      display: "flex",
      flexFlow: "column nowrap",
      alignItems: "stretch"
    },
    header: {
      fontSize: theme.fonts.xLargePlus,
      flex: "1 1 auto",
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.semibold,
      padding: "2px 12px 14px 24px",
      selectors: {
        "& h2": {
          fontSize: 24,
          fontWeight: FontWeights.semibold
        }
      }
    },
    body: {
      marginRight: 40,
      "& > *": {
        marginLeft: 15,
        ".ms-Link": { marginTop: 10 },
        "& h3": { fontWeight: 600, margin: 0 }
      }
    },
    closeButton: {
      color: theme.palette.neutralPrimary,
      marginLeft: "auto",
      marginTop: "4px",
      marginRight: "2px"
    },
    filterButton: { borderRadius: "25px" },
    filterElementSelected: {
      color: "black",
      fontWeight: "bold"
    },
    filterElementNotSelected: {
      color: "grey"
    },
    filterElementClearIcon: {
      marginLeft: 10
    }
  });
};
