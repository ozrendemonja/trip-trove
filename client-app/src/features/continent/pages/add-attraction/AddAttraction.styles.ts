import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    // TODO Repeating
    root: {
      padding: "12px",
      maxWidth: "1200px",
      borderRadius: "30px",
      background: theme.palette.white,
      display: "flex",
      flexDirection: "column"
    },
    header: {
      fontSize: "30px",
      marginLeft: "25px",
      marginTop: "5px",
      fontWeight: "600"
    },
    subHeader: {
      fontSize: "20px",
      marginTop: "10px",
      fontWeight: "600"
    },
    row: {
      marginTop: "15px"
    },
    attractionName: {
      width: "90vh",
      maxWidth: "1200px",
      marginLeft: "25px"
    },
    inputToggle: {
      marginTop: "26px"
    },
    dropdowns: {
      marginLeft: "25px",
      width: 300,
      selectors: {
        ".ms-Callout-main": {
          overflow: "visible",
          whiteSpace: "normal",
          height: "auto"
        }
      }
    },
    whereToVisit: {
      marginTop: "30px",
      marginLeft: "25px"
    },
    tip: {
      marginTop: "15px",
      marginLeft: "25px"
    },
    checkbox: {
      marginTop: "15px"
    },
    formText: {
      maxWidth: "1200px",
      marginLeft: "25px"
    },
    formDropdown: {
      paddingTop: "15px",
      selectors: {
        ".ms-Dropdown": {
          width: "300px"
        }
      }
    },
    footer: {
      height: "40px",
      width: "100%",
      marginTop: "48px"
    }
  });
};

export const searchOverride = {
  searchBox: {
    width: "90vh",
    maxWidth: "1200px",
    marginTop: "10px",
    boxShadow: "0",
    marginLeft: "25px"
  }
};
