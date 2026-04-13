import { IButtonStyles, mergeStyleSets, useTheme } from "@fluentui/react";

export const useMyTripListClasses = () => {
  const theme = useTheme();

  const classes = mergeStyleSets({
    pageContainer: {
      overflow: "hidden",
      padding: "24px 32px",
      margin: "16px",
      boxSizing: "border-box",
      borderRadius: "30px",
      backgroundColor: theme.palette.white
    },
    pageHeader: {
      marginBottom: 32
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: 700,
      color: theme.palette.neutralDark
    },
    emptyState: {
      marginTop: 60,
      padding: 40,
      borderRadius: 8,
      backgroundColor: theme.palette.white,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      maxWidth: 420,
      textAlign: "center"
    },
    emptyIcon: {
      fontSize: 48,
      color: theme.palette.neutralTertiary,
      marginBottom: 16
    },
    emptyText: {
      fontSize: 16,
      color: theme.palette.neutralSecondary,
      marginBottom: 20
    },
    dateArrow: {
      fontSize: 18,
      color: theme.palette.neutralSecondary,
      padding: "0 4px",
      flexShrink: 0,
      userSelect: "none" as const,
      alignSelf: "flex-end",
      paddingBottom: 6
    },
    dateField: {
      flex: 1
    }
  });

  const cancelButtonStyles: IButtonStyles = {
    root: {
      border: `1px solid ${theme.palette.themePrimary}`,
      color: theme.palette.themePrimary,
      borderRadius: 6
    },
    rootHovered: {
      border: `1px solid ${theme.palette.themeDark}`,
      color: theme.palette.themeDark,
      backgroundColor: theme.palette.themeLight
    }
  };

  return { ...classes, cancelButtonStyles };
};
