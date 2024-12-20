import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    // TODO Repeating
    root: {
      padding: "12px",
      maxHeight: "90vh",
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
    form: {
      maxWidth: "600px",
      marginLeft: "25px"
    },
    footer: {
      height: "40px",
      width: "100%",
      marginTop: "48px"
    }
  });
};
