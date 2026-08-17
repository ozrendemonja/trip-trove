import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  root: {
    ...shorthands.padding(
      tokens.spacingVerticalM,
      tokens.spacingHorizontalM,
      0
    ),
    boxSizing: "border-box",
    maxHeight: "90%",
    maxWidth: "85%",
    ...shorthands.borderRadius("30px", "30px", 0, 0),
    backgroundColor: tokens.colorNeutralBackground1,
    "& > div:first-child": {
      width: "100%",
      minHeight: "42px",
      alignItems: "flex-start",
      flexWrap: "nowrap"
    },
    "& > div:first-child > h1": {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: tokens.spacingHorizontalMNudge,
      fontSize: tokens.fontSizeBase500,
      lineHeight: tokens.lineHeightBase500,
      fontWeight: tokens.fontWeightSemibold
    },
    "& .fui-SearchBox": {
      width: "320px",
      height: "28px",
      minHeight: "28px",
      marginTop: 0
    },
    "& .fui-SearchBox input": {
      height: "26px",
      fontSize: tokens.fontSizeBase200
    },
    "& > div:first-child > div:last-child": {
      width: "156px",
      marginTop: "0 !important"
    },
    "& > div:first-child > div:last-child .fui-Dropdown": {
      width: "100%",
      minWidth: 0
    },
    "& > div:first-child > div:last-child [role='combobox']": {
      width: "100%",
      minWidth: 0,
      minHeight: "28px",
      height: "28px",
      fontSize: tokens.fontSizeBase200,
      whiteSpace: "nowrap"
    },
    "& [role='menubar']": {
      minHeight: "32px",
      alignItems: "center",
      columnGap: `${tokens.spacingHorizontalXXS} !important`,
      marginLeft: tokens.spacingHorizontalSNudge
    },
    "& [role='menubar'] > button": {
      minWidth: "auto",
      minHeight: "28px",
      height: "28px",
      ...shorthands.padding(0, tokens.spacingHorizontalS),
      ...shorthands.borderColor(tokens.colorTransparentStroke),
      backgroundColor: tokens.colorTransparentBackground,
      fontSize: tokens.fontSizeBase200,
      fontWeight: tokens.fontWeightRegular
    },
    "& [role='menubar'] > button:hover": {
      ...shorthands.borderColor(tokens.colorTransparentStroke),
      backgroundColor: tokens.colorNeutralBackground1Hover
    },
    "& [role='menubar'] > button:last-child:not(:disabled):hover": {
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      color: tokens.colorNeutralForegroundStaticInverted,
      backgroundColor: tokens.colorPaletteRedForeground1,
      "& svg": {
        color: tokens.colorNeutralForegroundStaticInverted
      }
    },
    "& [role='menubar'] > button:disabled": {
      ...shorthands.borderColor(tokens.colorTransparentStroke),
      color: tokens.colorNeutralForegroundDisabled,
      backgroundColor: tokens.colorTransparentBackground,
      opacity: 1
    },
    "& [role='menubar'] > button:first-child svg": {
      color: tokens.colorBrandBackground
    },
    "& [role='menubar'] > button:disabled, & [role='menubar'] > button:disabled svg":
      {
        color: `${tokens.colorNeutralForegroundDisabled} !important`
      },
    "& [role='menubar'] > button svg": {
      width: "16px",
      height: "16px"
    },
    "@media (max-width: 700px)": {
      "& > div:first-child": {
        minHeight: "126px",
        flexWrap: "wrap",
        alignContent: "flex-start",
        rowGap: tokens.spacingVerticalS
      },
      "& > div:first-child > h1": {
        width: "100%",
        marginLeft: 0
      },
      "& > div:first-child > div": {
        width: "100%"
      },
      "& .fui-SearchBox": {
        width: "100%"
      },
      "& > div:first-child > div:last-child": {
        width: "100%"
      },
      "& [role='menubar']": {
        marginLeft: 0
      }
    }
  },
  listBody: {
    maxHeight: "90%",
    maxWidth: "85%",
    ...shorthands.overflow("auto"),
    ...shorthands.borderRadius(0, 0, "30px", "30px"),
    paddingBottom: tokens.spacingVerticalXXL,
    backgroundColor: tokens.colorNeutralBackground1
  }
});
