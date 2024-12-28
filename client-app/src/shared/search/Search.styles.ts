import { mergeStyleSets } from "@fluentui/react";

export const useClasses = (dropdownTopPosition: number) => {
  return mergeStyleSets({
    searchBox: {
      marginTop: "25px",
      boxShadow: "0 1px 6px 1px rgb(232, 228, 215)",
      borderBottomRadius: "10px",
      borderColor: "transparent",
      width: "400px"
    },
    dropdown: {
      width: "400px",
      borderRadius: "10px",
      borderColor: "transparent",
      boxShadow: "0 4px 6px 1px rgba(232, 228, 215,.36)",
      zIndex: "333",
      top: `${dropdownTopPosition}px`,
      position: "absolute"
    },
    button: {
      width: "400px",
      border: "0px",
      justifyContent: "flex-start",
      selectors: {
        ".ms-Button-label": {
          textAlign: "left"
        }
      }
    }
  });
};
