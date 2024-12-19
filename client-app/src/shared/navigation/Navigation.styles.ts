import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    container: {
      width: "200px",
      border: "1px solid " + theme.palette.white,
      padding: "10px",
      backgroundColor: theme.palette.white
    },
    homePageInfo: {
      border: "none",
      background: "none",
      selectors: {
        ":hover, :active": {
          backgroundColor: "transparent"
        }
      }
    },
    nav: {
      width: "185px",
      maxHeight: "80vh",
      boxSizing: "border-box",
      overflowY: "auto",
      backgroundColor: theme.palette.white,
      selectors: {
        "& .navigationHeaders": {
          marginLeft: "5px",
          fontWeight: "bold"
        }
      }
    }
  });
};
