import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    root: {
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      padding: "12px",
      paddingBottom: "0px",
      maxHeight: "90%",
      maxWidth: "85%",
      borderRadius: "30px 30px 0 0",
      background: theme.palette.white
    },
    linkField: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%"
    }
  });
};
