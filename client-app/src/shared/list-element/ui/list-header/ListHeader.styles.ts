import { mergeStyleSets } from "@fluentui/react";

const useClasses = () =>
  mergeStyleSets({
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
    searchBox: {
      marginTop: "25px",
      backgroundColor: "#F9FBFF",
      borderRadius: "10px",
      borderColor: "transparent",
      width: "300px"
    },
    dropdown: {
      marginTop: "25px",
      borderColor: "transparent",
      width: "200px",
      selectors: {
        ".ms-Dropdown-title": {
          backgroundColor: "#F9FBFF",
          borderRadius: "10px",
          borderColor: "transparent"
        }
      }
    },
    dropdownSelectedOption: {
      fontWeight: "600"
    }
  });

export default useClasses;
