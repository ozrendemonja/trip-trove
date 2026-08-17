import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const defaultSearchOption = {
  marginRight: tokens.spacingHorizontalM,
  marginBottom: "-10px"
};

export const useClasses = makeStyles({
  page: {
    display: "flex",
    minHeight: "calc(100vh - 16px)",
    "@media (max-width: 760px)": {
      flexDirection: "column",
      minHeight: "100vh"
    }
  },
  navigationRegion: {
    flexShrink: 0,
    "@media (max-width: 760px)": {
      width: "100%",
      "& > div": {
        width: "100%",
        maxWidth: "none",
        height: "auto",
        marginRight: 0,
        position: "relative"
      }
    }
  },
  mainContent: {
    position: "static",
    flexGrow: 1,
    minWidth: 0,
    minHeight: "calc(100vh - 16px)",
    "@media (max-width: 760px)": {
      position: "static",
      display: "flex",
      flexDirection: "column",
      minHeight: "420px"
    }
  },
  notSelectedSearchOption: {
    ...defaultSearchOption,
    ...shorthands.textDecoration("underline"),
    ":focus": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    ":active": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    ":hover": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    }
  },
  selectedSearchOption: {
    ...defaultSearchOption,
    color: tokens.colorNeutralForeground1,
    ...shorthands.textDecoration("none"),
    fontWeight: tokens.fontWeightBold,
    ":focus": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    ":active": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    ":hover": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    }
  },
  searchContiner: {
    position: "absolute",
    left: "50%",
    "@media (max-width: 760px)": {
      position: "static",
      width: "calc(100% - 32px)",
      alignItems: "stretch",
      alignSelf: "center",
      marginTop: tokens.spacingVerticalM,
      "& [role='grid']": {
        width: "100%"
      },
      "& [role='menuitem']": {
        width: "100%"
      }
    }
  },
  homeSearchBox: {
    "@media (max-width: 760px)": {
      width: "100%"
    }
  },
  gaugeContainer: {
    position: "absolute",
    top: "10px",
    right: "24px",
    display: "flex",
    alignItems: "center",
    ...shorthands.gap(tokens.spacingHorizontalXL),
    "@media (max-width: 760px)": {
      position: "static",
      alignSelf: "flex-end",
      marginRight: tokens.spacingHorizontalM
    }
  },
  mapIconButton: {
    backgroundColor: tokens.colorTransparentBackground,
    ...shorthands.border(0, "none"),
    ...shorthands.padding(tokens.spacingVerticalXS),
    cursor: "pointer",
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundLightAlphaHover
    },
    ":focus": {
      ...shorthands.outline(
        tokens.strokeWidthThick,
        "solid",
        tokens.colorBrandBackground
      ),
      outlineOffset: 2
    }
  },
  headerRow: {
    fontSize: tokens.fontSizeHero900,
    paddingBottom: tokens.spacingVerticalXL,
    paddingLeft: "20%",
    "@media (max-width: 760px)": {
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: 0
    }
  },
  headerIcon: {
    paddingTop: "12%",
    "@media (max-width: 760px)": {
      paddingTop: 0,
      width: "32px",
      height: "32px"
    }
  },
  headerText: {
    fontSize: tokens.fontSizeHero900,
    marginLeft: "15px",
    "@media (max-width: 760px)": {
      fontSize: tokens.fontSizeHero800,
      lineHeight: tokens.lineHeightHero800
    }
  }
});
