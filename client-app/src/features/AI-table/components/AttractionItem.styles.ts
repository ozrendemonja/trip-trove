import {
  IButtonStyles,
  IStyle,
  ITextFieldStyles,
  ITextStyles,
  mergeStyleSets,
  useTheme
} from "@fluentui/react";

export const useReviewStyles = () => {
  const theme = useTheme();

  const classes = mergeStyleSets({
    reviewSection: { marginTop: 4 } as IStyle,
    reviewAttached: {
      background: theme.palette.white,
      border: `1px solid ${theme.palette.neutralLight}`,
      borderRadius: 8,
      padding: "8px 10px",
      fontSize: "0.7rem",
      borderLeft: `3px solid ${theme.palette.green}`
    } as IStyle,
    reviewForm: {
      background: theme.palette.white,
      border: `1px solid ${theme.palette.neutralLight}`,
      borderRadius: 8,
      padding: 10
    } as IStyle
  });

  const attachedRating: ITextStyles = {
    root: {
      fontWeight: 500,
      color: theme.palette.neutralPrimary,
      fontSize: "0.7rem"
    }
  };

  const attachedNote: ITextStyles = {
    root: {
      color: theme.palette.neutralSecondary,
      whiteSpace: "pre-line",
      fontSize: "0.65rem"
    }
  };

  const removeBtn: IButtonStyles = {
    root: {
      background: "transparent",
      border: "none",
      borderRadius: "50%",
      padding: 4,
      color: theme.palette.neutralSecondary,
      minWidth: 0,
      minHeight: 0,
      height: 24,
      width: 24
    },
    icon: { fontSize: "0.65rem", color: theme.palette.neutralSecondary },
    rootHovered: {
      background: theme.palette.neutralLighter,
      color: theme.palette.redDark
    },
    iconHovered: { color: theme.palette.redDark },
    rootDisabled: { opacity: 0.4, cursor: "not-allowed" }
  };

  const ratingBtn = (isActive: boolean): IButtonStyles => ({
    root: {
      background: isActive
        ? theme.palette.themeLighterAlt
        : theme.palette.white,
      border: "1px solid",
      borderColor: isActive
        ? theme.palette.themePrimary
        : theme.palette.neutralLight,
      borderRadius: 20,
      padding: "4px 8px",
      cursor: "pointer",
      transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
      minWidth: 0,
      minHeight: 0,
      height: "auto",
      lineHeight: "1"
    },
    label: { fontSize: "1rem", lineHeight: "1", padding: 0 },
    textContainer: { flexGrow: 0 },
    rootHovered: isActive
      ? {
          background: theme.palette.themeLighterAlt,
          borderColor: theme.palette.themePrimary
        }
      : {
          background: theme.palette.neutralLighter,
          borderColor: theme.palette.neutralTertiaryAlt
        }
  });

  const noteInput: Partial<ITextFieldStyles> = {
    fieldGroup: {
      border: `1px solid ${theme.palette.neutralLight}`,
      borderRadius: 4,
      background: theme.palette.white,
      selectors: {
        ":hover": { borderColor: theme.palette.neutralTertiaryAlt },
        ":focus-within": {
          borderColor: theme.palette.themePrimary,
          boxShadow: `0 0 0 1px ${theme.palette.themePrimary}`
        }
      }
    },
    field: {
      fontSize: "0.7rem",
      padding: "6px 8px",
      color: theme.palette.neutralPrimary
    }
  };

  const addBtn: IButtonStyles = {
    root: {
      alignSelf: "flex-start",
      background: theme.palette.themePrimary,
      border: "none",
      borderRadius: 4,
      padding: "4px 14px",
      fontSize: "0.7rem",
      cursor: "pointer",
      color: theme.palette.white,
      fontWeight: 500,
      minWidth: 0,
      minHeight: 0,
      height: "auto"
    },
    label: { fontSize: "0.7rem", color: theme.palette.white },
    rootHovered: {
      background: theme.palette.themeDarkAlt,
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
    },
    rootDisabled: {
      background: theme.palette.neutralLight,
      color: theme.palette.neutralTertiary,
      cursor: "not-allowed"
    }
  };

  return {
    ...classes,
    attachedRating,
    attachedNote,
    removeBtn,
    ratingBtn,
    noteInput,
    addBtn
  };
};
