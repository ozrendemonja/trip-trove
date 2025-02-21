import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    root: {
      padding: "12px",
      paddingBottom: "0px",
      maxHeight: "90%",
      maxWidth: "85%",
      borderRadius: "30px 30px 0 0",
      background: theme.palette.white
    },
    listBody: {
      maxHeight: "90%",
      maxWidth: "85%",
      overflow: "auto",
      borderRadius: "0 0 30px 30px",
      paddingBottom: "24px",
      background: theme.palette.white,
      selectors: {
        "& .ms-Check-circle": {
          borderRadius: "50%"
        }
      }
    }
  });
};
