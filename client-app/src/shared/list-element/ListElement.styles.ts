import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    root: {
      padding: "12px",
      paddingBottom: "24px",
      maxHeight: "90%",
      maxWidth: "85%",
      borderRadius: "30px",
      background: theme.palette.white
    },
    listBody: {
      selectors: {
        "& .ms-Check-circle": {
          borderRadius: "50%"
        }
      }
    }
  });
};
