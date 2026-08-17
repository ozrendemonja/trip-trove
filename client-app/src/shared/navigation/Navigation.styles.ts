import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  container: {
    marginRight: "48px",
    width: "200px",
    maxWidth: "200px",
    height: "calc(100vh - 16px)",
    boxSizing: "border-box",
    ...shorthands.border("1px", "solid", tokens.colorNeutralBackground1),
    ...shorthands.padding(tokens.spacingVerticalMNudge),
    backgroundColor: tokens.colorNeutralBackground1,
    float: "left",
    position: "sticky",
    top: 0,
    "& > :last-child": {
      width: "100%",
      minWidth: 0,
      marginTop: "auto",
      justifyContent: "space-between"
    },
    "& > :last-child > :first-child": {
      minWidth: 0
    },
    "& > :last-child > :first-child > :last-child": {
      minWidth: 0,
      overflow: "hidden"
    },
    "& > :last-child > :first-child > :last-child > div": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  },
  homePageInfo: {
    ...shorthands.borderStyle("none"),
    background: "none",
    "&:hover": {
      backgroundColor: tokens.colorTransparentBackground
    },
    "&:active": {
      backgroundColor: tokens.colorTransparentBackground
    }
  },
  nav: {
    width: "185px",
    maxHeight: "80vh",
    boxSizing: "border-box",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground1,
    "& > div": {
      marginBottom: tokens.spacingVerticalXXL
    },
    "& > div:last-child": {
      marginBottom: 0
    },
    "& > div > div": {
      display: "flex",
      flexDirection: "column",
      rowGap: tokens.spacingVerticalXS
    },
    "& a, & button": {
      width: "100%",
      minHeight: "40px",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      columnGap: tokens.spacingHorizontalMNudge,
      paddingInlineEnd: tokens.spacingHorizontalM,
      color: tokens.colorNeutralForeground1,
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase300,
      fontWeight: tokens.fontWeightRegular,
      textDecorationLine: "none"
    },
    "& a:hover, & a:active, & button:hover, & button:active": {
      color: tokens.colorNeutralForeground1,
      backgroundColor: tokens.colorNeutralBackground1Hover,
      textDecorationLine: "none"
    },
    "& a svg, & button svg": {
      flexShrink: 0,
      color: tokens.colorPaletteBlueForeground2
    },
    "& button [data-button-label]": {
      display: "flex",
      alignItems: "center",
      flexGrow: 1,
      minWidth: 0
    },
    "& button [data-navigation-chevron]": {
      marginLeft: "auto",
      color: tokens.colorNeutralForeground2
    },
    "& .navigationHeaders": {
      marginLeft: "5px",
      marginBottom: tokens.spacingVerticalXS,
      fontWeight: tokens.fontWeightBold
    }
  }
});
