import { makeStyles, shorthands } from "@fluentui/react-components";

const defaultSearchOption = {
  marginRight: "12px",
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
      color: "black",
      ...shorthands.textDecoration("none")
    },
    ":active": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    ":hover": {
      color: "black",
      ...shorthands.textDecoration("none")
    }
  },
  selectedSearchOption: {
    ...defaultSearchOption,
    color: "black",
    ...shorthands.textDecoration("none"),
    fontWeight: "bold",
    ":focus": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    ":active": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    ":hover": {
      color: "black",
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
      marginTop: "12px",
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
    ...shorthands.gap("20px"),
    "@media (max-width: 760px)": {
      position: "static",
      alignSelf: "flex-end",
      marginRight: "12px"
    }
  },
  mapIconButton: {
    backgroundColor: "transparent",
    ...shorthands.border(0, "none"),
    ...shorthands.padding(4),
    cursor: "pointer",
    ...shorthands.borderRadius(8),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.4)"
    },
    ":focus": {
      ...shorthands.outline("2px", "solid", "#fec703"),
      outlineOffset: 2
    }
  },
  headerRow: {
    fontSize: "40px",
    paddingBottom: "20px",
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
    fontSize: "40px",
    marginLeft: "15px",
    "@media (max-width: 760px)": {
      fontSize: "32px",
      lineHeight: "40px"
    }
  }
});
